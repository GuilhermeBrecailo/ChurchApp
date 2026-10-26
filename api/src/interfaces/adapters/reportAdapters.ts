import { FastifyRequest } from "fastify";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext } from "../utils/churchContext";

function getAuthUserId(request: FastifyRequest): string {
  const authHeader = request.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");
  if (!token) throw new DomainError("Token não fornecido");
  const [, payload] = token.split(".");
  if (!payload) throw new DomainError("Token inválido");
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (!decoded?.sub) throw new DomainError("Token sem usuário");
  return decoded.sub as string;
}

type ReportQuery = {
  days?: string;
  departmentId?: string;
};

type AssignmentReportRow = {
  scheduleId: string;
  userId: string;
  confirmationStatus: string;
  attendanceStatus: string;
};

function groupAssignmentsByVolunteer(assignments: AssignmentReportRow[]) {
  const grouped = new Map<string, AssignmentReportRow>();
  const confirmationPriority: Record<string, number> = {
    CONFIRMED: 5,
    DECLINED: 4,
    SWAP_REQUESTED: 3,
    MAYBE: 2,
    PENDING: 1,
  };

  for (const assignment of assignments) {
    const key = `${assignment.scheduleId}:${assignment.userId}`;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, { ...assignment });
      continue;
    }

    if (
      (confirmationPriority[assignment.confirmationStatus] || 0) >
      (confirmationPriority[existing.confirmationStatus] || 0)
    ) {
      existing.confirmationStatus = assignment.confirmationStatus;
    }

    if (assignment.attendanceStatus === "PRESENT" || assignment.attendanceStatus === "ATTENDED") {
      existing.attendanceStatus = assignment.attendanceStatus;
    } else if (
      assignment.attendanceStatus === "ABSENT" &&
      existing.attendanceStatus === "PENDING"
    ) {
      existing.attendanceStatus = assignment.attendanceStatus;
    }
  }

  return [...grouped.values()];
}

export class ReportAdapters {
  private async getCurrentUser(request: FastifyRequest) {
    const user = await $prismaClient.user.findUnique({
      where: { id: getAuthUserId(request) },
    });
    if (!user) throw new DomainError("Usuário não encontrado");
    const context =
      request.churchContext ?? (await resolveActiveChurchContext(request, user.id));
    if (!context.activeChurchId) throw new DomainError("Usuário não possui igreja vinculada");
    if (!["PASTOR", "ADMIN", "SUPER_ADMIN"].includes(context.role)) {
      throw new DomainError("Acesso restrito a pastores ou admins");
    }
    if (!context.hasFeature("REPORTS")) {
      throw new DomainError("Relatórios estão disponíveis apenas no plano Pro");
    }
    return {
      ...user,
      crunchId: context.activeChurchId,
      role: context.role,
      canManageMembers: context.canManageMembers,
    };
  }

  private getFilters(request: FastifyRequest, crunchId: string) {
    const query = request.query as ReportQuery;
    const days = Math.max(Number(query.days) || 30, 1);
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    return {
      days,
      dateFrom,
      where: {
        schedule: {
          date: { gte: dateFrom },
          department: {
            crunchId,
            ...(query.departmentId ? { id: query.departmentId } : {}),
          },
        },
      },
    };
  }

  async getConfirmationReport(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { days, dateFrom, where } = this.getFilters(request, user.crunchId!);

    const assignments = groupAssignmentsByVolunteer(await $prismaClient.scheduleAssignment.findMany({
      where,
      select: {
        scheduleId: true,
        userId: true,
        confirmationStatus: true,
        attendanceStatus: true,
      },
    }));

    const scheduleIds = [...new Set(assignments.map((assignment) => assignment.scheduleId))];
    const schedules = await $prismaClient.schedule.findMany({
      where: { id: { in: scheduleIds } },
      select: {
        id: true,
        description: true,
        date: true,
        department: { select: { id: true, name: true } },
      },
    });
    const scheduleMap = new Map(schedules.map((schedule) => [schedule.id, schedule]));

    const grouped = new Map<string, {
      scheduleId: string;
      schedule: string;
      date: Date;
      department: { id: string; name: string };
      confirmed: number;
      declined: number;
      pending: number;
      total: number;
    }>();

    assignments.forEach((assignment) => {
      const schedule = scheduleMap.get(assignment.scheduleId);
      if (!schedule) return;
      const current = grouped.get(assignment.scheduleId) ?? {
        scheduleId: assignment.scheduleId,
        schedule: schedule.description,
        date: schedule.date,
        department: schedule.department,
        confirmed: 0,
        declined: 0,
        pending: 0,
        total: 0,
      };
      if (assignment.confirmationStatus === "CONFIRMED") current.confirmed += 1;
      else if (assignment.confirmationStatus === "DECLINED") current.declined += 1;
      else current.pending += 1;
      current.total += 1;
      grouped.set(assignment.scheduleId, current);
    });

    return {
      days,
      dateFrom,
      items: Array.from(grouped.values()).sort(
        (first, second) => second.date.getTime() - first.date.getTime(),
      ),
    };
  }

  async getAttendanceReport(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { days, dateFrom, where } = this.getFilters(request, user.crunchId!);

    const assignments = groupAssignmentsByVolunteer(await $prismaClient.scheduleAssignment.findMany({
      where,
      select: {
        scheduleId: true,
        userId: true,
        confirmationStatus: true,
        attendanceStatus: true,
      },
    }));

    const total = assignments.length;
    const attended = assignments.filter(
      (assignment) => assignment.attendanceStatus === "PRESENT" || assignment.attendanceStatus === "ATTENDED",
    ).length;
    const absent = assignments.filter((assignment) => assignment.attendanceStatus === "ABSENT").length;
    const pending = total - attended - absent;
    const detailCounts = new Map<string, { scheduleId: string; attendanceStatus: string; _count: number }>();
    for (const assignment of assignments) {
      const key = `${assignment.scheduleId}:${assignment.attendanceStatus}`;
      const current = detailCounts.get(key) || {
        scheduleId: assignment.scheduleId,
        attendanceStatus: assignment.attendanceStatus,
        _count: 0,
      };
      current._count += 1;
      detailCounts.set(key, current);
    }

    return {
      days,
      dateFrom,
      total,
      attended,
      absent,
      pending,
      attendanceRate: total > 0 ? Math.round((attended / total) * 100) : 0,
      details: [...detailCounts.values()],
    };
  }

  async getMembersReport(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { days, dateFrom, where } = this.getFilters(request, user.crunchId!);

    const assignments = groupAssignmentsByVolunteer(await $prismaClient.scheduleAssignment.findMany({
      where,
      select: {
        scheduleId: true,
        userId: true,
        confirmationStatus: true,
        attendanceStatus: true,
      },
    }));

    const userIds = [...new Set(assignments.map((assignment) => assignment.userId))];
    const members = await $prismaClient.user.findMany({
      where: { id: { in: userIds }, crunchId: user.crunchId! },
      select: { id: true, name: true, email: true },
    });

    const memberMap = new Map(members.map((member) => [member.id, member]));
    const assignmentsByUser = new Map<string, AssignmentReportRow[]>();
    for (const assignment of assignments) {
      const current = assignmentsByUser.get(assignment.userId) || [];
      current.push(assignment);
      assignmentsByUser.set(assignment.userId, current);
    }

    const items = userIds.map((userId) => {
      const memberAssignments = assignmentsByUser.get(userId) || [];
      const confirmed = memberAssignments.filter(
        (assignment) => assignment.confirmationStatus === "CONFIRMED",
      ).length;
      const declined = memberAssignments.filter(
        (assignment) => assignment.confirmationStatus === "DECLINED",
      ).length;
      const absent = memberAssignments.filter(
        (assignment) => assignment.attendanceStatus === "ABSENT",
      ).length;

      return {
        userId,
        name: memberMap.get(userId)?.name || "Membro",
        email: memberMap.get(userId)?.email || "",
        total: memberAssignments.length,
        confirmed,
        declined,
        absent,
      };
    });

    return {
      days,
      dateFrom,
      items: items.sort((first, second) => second.absent - first.absent),
    };
  }
}
