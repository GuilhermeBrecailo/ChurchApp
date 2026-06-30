import { FastifyRequest } from "fastify";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";

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

export class ReportAdapters {
  private async getCurrentUser(request: FastifyRequest) {
    const user = await $prismaClient.user.findUnique({
      where: { id: getAuthUserId(request) },
    });
    if (!user) throw new DomainError("Usuário não encontrado");
    if (!user.crunchId) throw new DomainError("Usuário não possui igreja vinculada");
    if (!["PASTOR", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      throw new DomainError("Acesso restrito a pastores ou admins");
    }
    return user;
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

    const rows = await $prismaClient.scheduleAssignment.groupBy({
      by: ["confirmationStatus", "scheduleId"],
      where,
      _count: true,
    });

    const scheduleIds = [...new Set(rows.map((row) => row.scheduleId))];
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

    rows.forEach((row) => {
      const schedule = scheduleMap.get(row.scheduleId);
      if (!schedule) return;
      const current = grouped.get(row.scheduleId) ?? {
        scheduleId: row.scheduleId,
        schedule: schedule.description,
        date: schedule.date,
        department: schedule.department,
        confirmed: 0,
        declined: 0,
        pending: 0,
        total: 0,
      };
      const count = row._count;
      if (row.confirmationStatus === "CONFIRMED") current.confirmed += count;
      else if (row.confirmationStatus === "DECLINED") current.declined += count;
      else current.pending += count;
      current.total += count;
      grouped.set(row.scheduleId, current);
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

    const rows = await $prismaClient.scheduleAssignment.groupBy({
      by: ["attendanceStatus", "scheduleId"],
      where,
      _count: true,
    });

    const total = rows.reduce((sum, row) => sum + row._count, 0);
    const attended = rows
      .filter((row) => row.attendanceStatus === "PRESENT" || row.attendanceStatus === "ATTENDED")
      .reduce((sum, row) => sum + row._count, 0);
    const absent = rows
      .filter((row) => row.attendanceStatus === "ABSENT")
      .reduce((sum, row) => sum + row._count, 0);
    const pending = total - attended - absent;

    return {
      days,
      dateFrom,
      total,
      attended,
      absent,
      pending,
      attendanceRate: total > 0 ? Math.round((attended / total) * 100) : 0,
      details: rows,
    };
  }

  async getMembersReport(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { days, dateFrom, where } = this.getFilters(request, user.crunchId!);

    const rows = await $prismaClient.scheduleAssignment.groupBy({
      by: ["userId"],
      where,
      _count: { confirmationStatus: true },
    });

    const userIds = rows.map((row) => row.userId);
    const [members, assignments] = await Promise.all([
      $prismaClient.user.findMany({
        where: { id: { in: userIds }, crunchId: user.crunchId! },
        select: { id: true, name: true, email: true },
      }),
      $prismaClient.scheduleAssignment.findMany({
        where: { ...where, userId: { in: userIds } },
        select: {
          userId: true,
          confirmationStatus: true,
          attendanceStatus: true,
        },
      }),
    ]);

    const memberMap = new Map(members.map((member) => [member.id, member]));

    const items = rows.map((row) => {
      const memberAssignments = assignments.filter(
        (assignment) => assignment.userId === row.userId,
      );
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
        userId: row.userId,
        name: memberMap.get(row.userId)?.name || "Membro",
        email: memberMap.get(row.userId)?.email || "",
        total: row._count.confirmationStatus,
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
