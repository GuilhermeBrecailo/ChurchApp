import { FastifyRequest } from "fastify";
import { z } from "zod";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext, RoleContext } from "../utils/churchContext";
import { isPrivilegedRole } from "../../application/Services/Auth/AuthorizationService";

type CurrentUser = {
  id: string;
  crunchId: string;
  role: string;
  roles: RoleContext[];
};

function getAuthUserId(request: FastifyRequest) {
  const authHeader = request.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");
  if (!token) throw new DomainError("Token não fornecido");
  const [, payload] = token.split(".");
  if (!payload) throw new DomainError("Token inválido");
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (!decoded?.sub) throw new DomainError("Token sem usuário");
  return decoded.sub as string;
}

const upsertSchema = z.object({
  serviceTimeId: z.string().trim().min(1, "Culto é obrigatório"),
  date: z.string().trim().min(1, "Data é obrigatória"),
  visitorCount: z.number().int().min(0, "Não pode ser negativo"),
  memberCount: z.number().int().min(0, "Não pode ser negativo"),
  notes: z.string().trim().optional().or(z.literal("")),
});

export class AttendanceAdapters {
  private async getCurrentUser(request: FastifyRequest): Promise<CurrentUser> {
    const userId = getAuthUserId(request);
    const context = request.churchContext ?? (await resolveActiveChurchContext(request, userId));
    if (!context.activeChurchId) throw new DomainError("Usuário não possui igreja vinculada");

    return {
      id: userId,
      crunchId: context.activeChurchId,
      role: context.role,
      roles: context.roles,
    };
  }

  // Ferramenta pastoral basica, mesmo gate do rol/mensagens - sem trava de
  // plano de proposito (diferente do ReportAdapters, que exige feature
  // "REPORTS"), ja que isso e registro do dia a dia, nao analise avancada.
  private assertCanManageAttendance(user: CurrentUser) {
    if (isPrivilegedRole(user)) return;
    throw new DomainError("Apenas pastores ou administradores podem registrar presença");
  }

  private async assertOwnedServiceTime(serviceTimeId: string, crunchId: string) {
    const serviceTime = await $prismaClient.serviceTime.findUnique({ where: { id: serviceTimeId } });
    if (!serviceTime || serviceTime.crunchId !== crunchId) {
      throw new DomainError("Culto não encontrado");
    }
  }

  // Upsert por culto+data (unique juntos no schema) - lancar de novo no mesmo
  // culto/dia edita o registro em vez de duplicar.
  async upsert(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageAttendance(user);
    const body = upsertSchema.parse(request.body);
    await this.assertOwnedServiceTime(body.serviceTimeId, user.crunchId);

    const date = new Date(body.date);

    return $prismaClient.serviceAttendance.upsert({
      where: {
        serviceTimeId_date: { serviceTimeId: body.serviceTimeId, date },
      },
      create: {
        crunchId: user.crunchId,
        serviceTimeId: body.serviceTimeId,
        date,
        visitorCount: body.visitorCount,
        memberCount: body.memberCount,
        notes: body.notes || null,
      },
      update: {
        visitorCount: body.visitorCount,
        memberCount: body.memberCount,
        notes: body.notes || null,
      },
    });
  }

  async list(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageAttendance(user);
    const { days } = request.query as { days?: string };
    const parsedDays = Math.max(Number(days) || 30, 1);
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parsedDays);

    return $prismaClient.serviceAttendance.findMany({
      where: { crunchId: user.crunchId, date: { gte: dateFrom } },
      include: { serviceTime: { select: { id: true, label: true, weekday: true, time: true } } },
      orderBy: { date: "desc" },
    });
  }
}
