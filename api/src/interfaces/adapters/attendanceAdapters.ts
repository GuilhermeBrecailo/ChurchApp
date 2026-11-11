import { FastifyRequest } from "fastify";
import { z } from "zod";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext, RoleContext } from "../utils/churchContext";
import { hasPermission } from "../../application/Services/Auth/AuthorizationService";

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

  // Ferramenta pastoral basica - sem trava de plano de proposito (diferente
  // do ReportAdapters, que exige feature "REPORTS"), ja que isso e registro
  // do dia a dia, nao analise avancada. Mesmo gate da presenca nominal do
  // culto (ServiceOccurrenceAdapters): pastor/admin ou cargo com
  // CULT_ATTENDANCE_MANAGE, para a tela do culto mostrar o mesmo a todos.
  private assertCanManageAttendance(user: CurrentUser) {
    if (hasPermission(user, "CULT_ATTENDANCE_MANAGE")) return;
    throw new DomainError("Sem permissão para registrar presença do culto");
  }

  private parseDateKey(raw: unknown) {
    if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
      throw new DomainError("Data do culto inválida");
    }
    return new Date(raw.trim());
  }

  private async findOwnedOccurrence(occurrenceId: string, crunchId: string) {
    const occurrence = await $prismaClient.serviceOccurrence.findFirst({
      where: { id: occurrenceId, crunchId },
      select: { id: true, date: true, time: true, serviceTimeId: true },
    });
    if (!occurrence) throw new DomainError("Culto não encontrado");
    return occurrence;
  }

  private async assertOwnedServiceTime(serviceTimeId: string, crunchId: string) {
    const serviceTime = await $prismaClient.serviceTime.findUnique({ where: { id: serviceTimeId } });
    if (!serviceTime || serviceTime.crunchId !== crunchId) {
      throw new DomainError("Culto não encontrado");
    }
    return serviceTime;
  }

  // So busca, nunca cria - criar uma ocorrencia e responsabilidade do hub
  // (POST /service-occurrences). Aqui e so um vinculo aditivo: se o culto
  // hub ja foi aberto pra esse dia, a presenca linkada aparece nele; se
  // ninguem abriu o hub ainda, o registro de presenca funciona normalmente
  // sem o vinculo (o hub sempre le por serviceTimeId+data, nao depende disso).
  private async findOccurrenceId(serviceTimeId: string, date: Date, crunchId: string) {
    const occurrence = await $prismaClient.serviceOccurrence.findFirst({
      where: { serviceTimeId, date, crunchId },
      select: { id: true },
    });
    return occurrence?.id;
  }

  // Upsert por culto+data (unique juntos no schema) - lancar de novo no mesmo
  // culto/dia edita o registro em vez de duplicar.
  async upsert(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageAttendance(user);
    const body = upsertSchema.parse(request.body);
    await this.assertOwnedServiceTime(body.serviceTimeId, user.crunchId);

    const date = new Date(body.date);
    const serviceOccurrenceId = await this.findOccurrenceId(body.serviceTimeId, date, user.crunchId);

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
        serviceOccurrenceId,
      },
      update: {
        visitorCount: body.visitorCount,
        memberCount: body.memberCount,
        notes: body.notes || null,
        serviceOccurrenceId,
      },
    });
  }

  // Chave do dia igual a usada pelo upsert manual (new Date("YYYY-MM-DD"),
  // meia-noite UTC) - garante que "Finalizar culto" bate no mesmo registro
  // que "Registrar presença" cria/edita pro mesmo dia. Usa o dia LOCAL do
  // servidor (o mesmo da hora do culto), nao o dia UTC.
  private todayDateKey(): Date {
    const now = new Date();
    const local = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return new Date(local);
  }

  // "Finalizar culto" - upsert por culto+hoje com endedAt = agora, sem tocar
  // em visitorCount/memberCount (ficam 0 se o registro ainda nao existir, ou
  // como estavam se "Registrar presença" ja rodou hoje). Reapertar so
  // sobrescreve endedAt com o horario mais recente - sem confirmacao, mesmo
  // padrao de "Registrar presença".
  //
  // O dia vem do culto aberto (body.occurrenceId) ou de body.date
  // (YYYY-MM-DD); so sem nenhum dos dois cai em "hoje" (compatibilidade).
  // Antes gravava sempre hoje, mesmo finalizando o culto de domingo na
  // segunda.
  async finalize(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageAttendance(user);
    const { serviceTimeId } = request.params as { serviceTimeId?: string };
    if (!serviceTimeId) throw new DomainError("Culto não informado");
    const serviceTime = await this.assertOwnedServiceTime(serviceTimeId, user.crunchId);
    const body = (request.body ?? {}) as { date?: unknown; occurrenceId?: unknown };

    let date: Date;
    let time = serviceTime.time;
    let knownOccurrenceId: string | undefined;
    if (typeof body.occurrenceId === "string" && body.occurrenceId.trim()) {
      const occurrence = await this.findOwnedOccurrence(body.occurrenceId.trim(), user.crunchId);
      if (occurrence.serviceTimeId !== serviceTimeId) {
        throw new DomainError("Esse culto não pertence a este horário");
      }
      date = occurrence.date;
      time = occurrence.time || time;
      knownOccurrenceId = occurrence.id;
    } else if (body.date !== undefined) {
      date = this.parseDateKey(body.date);
    } else {
      date = this.todayDateKey();
    }

    const [hour, minute] = time.split(":").map(Number);
    const scheduledAt = new Date(`${date.toISOString().slice(0, 10)}T00:00:00`);
    scheduledAt.setHours(hour, minute, 0, 0);
    if (new Date() < scheduledAt) {
      throw new DomainError("Esse culto ainda não começou");
    }

    const endedAt = new Date();
    const serviceOccurrenceId =
      knownOccurrenceId ?? (await this.findOccurrenceId(serviceTimeId, date, user.crunchId));

    return $prismaClient.serviceAttendance.upsert({
      where: {
        serviceTimeId_date: { serviceTimeId, date },
      },
      create: {
        crunchId: user.crunchId,
        serviceTimeId,
        date,
        visitorCount: 0,
        memberCount: 0,
        endedAt,
        serviceOccurrenceId,
      },
      update: {
        endedAt,
        serviceOccurrenceId,
      },
    });
  }

  async list(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageAttendance(user);
    const { days, occurrenceId, serviceTimeId, date } = (request.query ?? {}) as {
      days?: string;
      occurrenceId?: string;
      serviceTimeId?: string;
      date?: string;
    };

    // Busca pontual de um culto (a tela do culto): no maximo um registro,
    // em vez de carregar um ano inteiro para achar uma linha.
    if (occurrenceId || (serviceTimeId && date)) {
      let where: { crunchId: string; serviceTimeId: string; date: Date };
      if (occurrenceId) {
        const occurrence = await this.findOwnedOccurrence(occurrenceId, user.crunchId);
        if (!occurrence.serviceTimeId) return [];
        where = { crunchId: user.crunchId, serviceTimeId: occurrence.serviceTimeId, date: occurrence.date };
      } else {
        where = { crunchId: user.crunchId, serviceTimeId: serviceTimeId!, date: this.parseDateKey(date) };
      }

      return $prismaClient.serviceAttendance.findMany({
        where,
        include: { serviceTime: { select: { id: true, label: true, weekday: true, time: true } } },
        take: 1,
      });
    }

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
