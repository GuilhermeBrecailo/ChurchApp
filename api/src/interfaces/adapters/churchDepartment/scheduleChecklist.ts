import crypto from "node:crypto";
import { FastifyRequest } from "fastify/types/request";
import { $prismaClient } from "../../../../config/database";
import { DomainError } from "../../../domain/value-objects/utils/DomainError";
import { CurrentUser } from "./types";
import { DepartmentContext } from "./context";

const db = $prismaClient as any;

export const DEACONATE_CHECKLIST_DEFAULTS = [
  { templateKey: "TEAM_CONFIRMATION", title: "Confirmar equipe e escala", order: 0 },
  { templateKey: "WATER_AND_CUPS", title: "Conferir água e copos", order: 1 },
] as const;

export const COMMUNION_CHECKLIST_DEFAULT = {
  templateKey: "COMMUNION_PREPARATION",
  title: "Preparar a Santa Ceia",
  order: 2,
} as const;

type ChecklistSchedule = {
  id: string;
  departmentId: string;
  description: string;
  department: { id: string; name: string; type: string; leaderId: string };
};

export class ScheduleChecklistAdapters {
  constructor(private context: DepartmentContext) {}

  private async getSchedule(scheduleId: string, crunchId: string): Promise<ChecklistSchedule> {
    const schedule = await db.schedule.findFirst({
      where: { id: scheduleId, department: { crunchId } },
      select: {
        id: true,
        departmentId: true,
        description: true,
        department: { select: { id: true, name: true, type: true, leaderId: true } },
      },
    });

    if (!schedule) throw new DomainError("Escala não encontrada nesta igreja");
    return schedule;
  }

  private async assertCanAccess(user: CurrentUser, schedule: ChecklistSchedule) {
    const capabilities = this.context.departmentCapabilities(user, {
      id: schedule.departmentId,
      leaderId: schedule.department.leaderId,
    });

    if (this.context.isChurchWideManager(user) || capabilities.canManageSchedule) return;

    const membership = await db.userDepartmentMembership.findUnique({
      where: {
        userId_departmentId: { userId: user.id, departmentId: schedule.departmentId },
      },
      select: { id: true },
    });

    if (!membership) {
      throw new DomainError("Apenas a equipe deste ministério pode acessar o checklist");
    }
  }

  private async assertCanManage(user: CurrentUser, scheduleId: string, departmentId: string) {
    await this.context.assertDepartmentPermission(
      user,
      departmentId,
      "SCHEDULE_EDIT",
      "Apenas pastores, admins, líderes ou responsáveis pela escala podem editar o checklist",
    );
    return await this.getSchedule(scheduleId, user.crunchId!);
  }

  private parseDueAt(value: unknown): Date | null {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value !== "string") throw new DomainError("Data limite inválida");
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new DomainError("Data limite inválida");
    return date;
  }

  private async assertAssignee(assigneeId: unknown, crunchId: string) {
    if (assigneeId === null || assigneeId === undefined || assigneeId === "") return null;
    if (typeof assigneeId !== "string") throw new DomainError("Responsável inválido");
    const user = await db.user.findFirst({
      where: { id: assigneeId, crunchId },
      select: { id: true },
    });
    if (!user) throw new DomainError("Responsável não encontrado nesta igreja");
    return user.id as string;
  }

  async getChurchScheduleChecklist(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Escala não informada");

    const schedule = await this.getSchedule(id, user.crunchId!);
    await this.assertCanAccess(user, schedule);
    return await db.scheduleChecklistItem.findMany({
      where: { scheduleId: id },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: { assignee: { select: { id: true, name: true } } },
    });
  }

  async createChurchScheduleChecklistItem(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as { title?: unknown; assigneeId?: unknown; dueAt?: unknown };
    if (!id) throw new DomainError("Escala não informada");

    const schedule = await this.getSchedule(id, user.crunchId!);
    await this.assertCanManage(user, id, schedule.departmentId);
    if (typeof body.title !== "string" || !body.title.trim()) {
      throw new DomainError("O nome do lembrete é obrigatório");
    }
    if (body.title.trim().length > 180) throw new DomainError("O nome do lembrete é muito longo");

    const assigneeId = await this.assertAssignee(body.assigneeId, user.crunchId!);
    const dueAt = this.parseDueAt(body.dueAt);
    const lastItem = await db.scheduleChecklistItem.findFirst({
      where: { scheduleId: id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    return await db.scheduleChecklistItem.create({
      data: {
        id: crypto.randomUUID(),
        scheduleId: id,
        title: body.title.trim(),
        assigneeId,
        dueAt,
        isComplete: false,
        completedAt: null,
        isApplicable: true,
        templateKey: null,
        order: (lastItem?.order ?? -1) + 1,
      },
      include: { assignee: { select: { id: true, name: true } } },
    });
  }

  async updateChurchScheduleChecklistItem(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id, itemId } = request.params as { id?: string; itemId?: string };
    const body = request.body as {
      title?: unknown;
      assigneeId?: unknown;
      dueAt?: unknown;
      isComplete?: unknown;
    };
    if (!id || !itemId) throw new DomainError("Escala ou item não informado");

    const schedule = await this.getSchedule(id, user.crunchId!);
    const item = await db.scheduleChecklistItem.findFirst({
      where: { id: itemId, scheduleId: id },
      select: { id: true, templateKey: true },
    });
    if (!item) throw new DomainError("Item não encontrado nesta escala");

    const hasManagementChanges =
      body.title !== undefined || body.assigneeId !== undefined || body.dueAt !== undefined;
    if (item.templateKey && hasManagementChanges) {
      throw new DomainError("Os lembretes padrão não podem ser editados");
    }
    if (hasManagementChanges) {
      await this.assertCanManage(user, id, schedule.departmentId);
    } else {
      await this.assertCanAccess(user, schedule);
    }

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        throw new DomainError("O nome do lembrete é obrigatório");
      }
      if (body.title.trim().length > 180) throw new DomainError("O nome do lembrete é muito longo");
      data.title = body.title.trim();
    }
    if (body.assigneeId !== undefined) {
      data.assigneeId = await this.assertAssignee(body.assigneeId, user.crunchId!);
    }
    if (body.dueAt !== undefined) data.dueAt = this.parseDueAt(body.dueAt);
    if (body.isComplete !== undefined) {
      if (typeof body.isComplete !== "boolean") throw new DomainError("Status de conclusão inválido");
      data.isComplete = body.isComplete;
      data.completedAt = body.isComplete ? new Date() : null;
    }
    if (Object.keys(data).length === 0) throw new DomainError("Nenhuma alteração informada");

    return await db.scheduleChecklistItem.update({
      where: { id: itemId },
      data,
      include: { assignee: { select: { id: true, name: true } } },
    });
  }

  async deleteChurchScheduleChecklistItem(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id, itemId } = request.params as { id?: string; itemId?: string };
    if (!id || !itemId) throw new DomainError("Escala ou item não informado");

    const schedule = await this.getSchedule(id, user.crunchId!);
    await this.assertCanManage(user, id, schedule.departmentId);
    const item = await db.scheduleChecklistItem.findFirst({
      where: { id: itemId, scheduleId: id },
      select: { id: true, templateKey: true },
    });
    if (!item) throw new DomainError("Item não encontrado nesta escala");
    if (item.templateKey) throw new DomainError("Os lembretes padrão não podem ser removidos");
    return await db.scheduleChecklistItem.delete({ where: { id: itemId } });
  }

  async copyChurchScheduleChecklistItems(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const { sourceScheduleId } = request.body as { sourceScheduleId?: unknown };
    if (!id || typeof sourceScheduleId !== "string" || !sourceScheduleId.trim()) {
      throw new DomainError("Escala de origem não informada");
    }
    if (id === sourceScheduleId) throw new DomainError("Escolha outra escala para copiar");

    const target = await this.getSchedule(id, user.crunchId!);
    const source = await this.getSchedule(sourceScheduleId, user.crunchId!);
    await this.assertCanManage(user, id, target.departmentId);
    await this.assertCanManage(user, sourceScheduleId, source.departmentId);
    if (target.departmentId !== source.departmentId) {
      throw new DomainError("Só é possível copiar lembretes de outra escala deste ministério");
    }

    const existingCustomItems = await db.scheduleChecklistItem.findMany({
      where: { scheduleId: id, templateKey: null },
      take: 1,
      select: { id: true },
    });
    if (existingCustomItems.length > 0) {
      throw new DomainError("Esta escala já tem lembretes personalizados");
    }

    const sourceItems = await db.scheduleChecklistItem.findMany({
      where: { scheduleId: sourceScheduleId, templateKey: null },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: { title: true, assigneeId: true },
    });
    const assignedIds = [...new Set(sourceItems.map((item: { assigneeId: string | null }) => item.assigneeId).filter(Boolean))] as string[];
    if (assignedIds.length > 0) {
      const validUsers = await db.user.findMany({
        where: { id: { in: assignedIds }, crunchId: user.crunchId! },
        select: { id: true },
      });
      if (validUsers.length !== assignedIds.length) {
        throw new DomainError("Um responsável da escala de origem não pertence a esta igreja");
      }
    }

    if (sourceItems.length === 0) return { count: 0 };
    const lastTargetItem = await db.scheduleChecklistItem.findFirst({
      where: { scheduleId: id },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const firstCopiedOrder = (lastTargetItem?.order ?? 1) + 1;
    return await db.scheduleChecklistItem.createMany({
      data: sourceItems.map((item: { title: string; assigneeId: string | null }, index: number) => ({
        id: crypto.randomUUID(),
        scheduleId: id,
        title: item.title,
        assigneeId: item.assigneeId,
        dueAt: null,
        isComplete: false,
        completedAt: null,
        isApplicable: true,
        templateKey: null,
        order: firstCopiedOrder + index,
      })),
    });
  }
}
