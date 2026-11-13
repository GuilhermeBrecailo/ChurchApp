import { FastifyRequest } from "fastify";
import { z } from "zod";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { isPrivilegedRole } from "../../application/Services/Auth/AuthorizationService";
import { WhatsAppServiceClient } from "../../infrastructure/whatsapp/WhatsAppServiceClient";
import {
  getPeopleViewer,
  PeopleAccess,
  PeopleViewer,
  resolvePeopleAccess,
} from "../utils/peopleAccess";
import { syncMissingRosterMembers } from "../utils/rosterLink";

type CurrentUser = PeopleViewer & { access: PeopleAccess };

const createSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório"),
  email: z.string().trim().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  birthDate: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  contactConsent: z.boolean().default(false),
  // Visitante (padrão, entra no acolhimento) ou membro sem conta no app.
  status: z.enum(["VISITOR", "MEMBER"]).default("VISITOR"),
});

const updateSchema = createSchema.omit({ contactConsent: true, status: true }).partial();

const consentSchema = z.object({
  consentToContact: z.boolean(),
  note: z.string().trim().max(600).optional(),
});

export class RosterAdapters {
  private async getCurrentUser(request: FastifyRequest): Promise<CurrentUser> {
    const viewer = await getPeopleViewer(request);
    return { ...viewer, access: resolvePeopleAccess(viewer) };
  }

  // Conferir WhatsApp e o relatorio continuam so do pastor/admin (o WhatsApp
  // da igreja e o relatorio sao ferramentas dele).
  private assertCanManageRoster(user: CurrentUser) {
    if (isPrivilegedRole(user)) return;
    throw new DomainError("Apenas pastores ou administradores podem gerenciar o rol de membros");
  }

  // Ler o rol: secretaria (MEMBER_*) e quem faz cuidado pastoral - quem
  // agenda visita precisa escolher a pessoa.
  private assertCanReadRoster(user: CurrentUser) {
    if (user.access.canSeeRoster) return;
    throw new DomainError("Sem permissão para ver as pessoas da igreja");
  }

  private assertCanEdit(user: CurrentUser, member?: { status: string }) {
    if (user.access.canEdit) return;
    // Quem faz o acolhimento pode corrigir os dados do visitante que cadastrou.
    if (user.access.canCare && member?.status === "VISITOR") return;
    throw new DomainError("Sem permissão para editar pessoas");
  }

  private assertCanChangeStatus(user: CurrentUser) {
    if (user.access.canEdit || user.access.canDelete) return;
    throw new DomainError("Sem permissão para mudar a situação desta pessoa");
  }

  async list(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanReadRoster(user);
    // Auto-correcao barata: so cria o registro de quem tem conta ativa e
    // ainda nao aparece no rol (uma consulta quando esta tudo certo).
    await syncMissingRosterMembers(user.crunchId);

    const { status } = request.query as { status?: string };
    const where =
      status === "ALL"
        ? { crunchId: user.crunchId }
        : status === "VISITOR" || status === "MEMBER" || status === "FORMER"
          ? { crunchId: user.crunchId, status }
          // Sem filtro explicito: lista do dia a dia, sem quem ja saiu.
          : { crunchId: user.crunchId, status: { not: "FORMER" } };

    return await $prismaClient.rosterMember.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  // Contagem por status pra Relatorios - so VISITOR/MEMBER (FORMER fica de
  // fora, mesmo criterio de "ALL" em statusesForAudience). groupBy indexado
  // (@@index([crunchId, status])), sem trazer o rol inteiro so pra contar.
  async getRosterReport(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageRoster(user);

    const counts = await $prismaClient.rosterMember.groupBy({
      by: ["status"],
      where: { crunchId: user.crunchId, status: { in: ["VISITOR", "MEMBER"] } },
      _count: true,
    });

    const visitors = counts.find((row) => row.status === "VISITOR")?._count ?? 0;
    const members = counts.find((row) => row.status === "MEMBER")?._count ?? 0;

    return { visitors, members };
  }

  async create(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const body = createSchema.parse(request.body);

    if (body.status === "MEMBER" && !user.access.canCreate) {
      throw new DomainError("Sem permissão para cadastrar membros");
    }
    if (body.status === "VISITOR" && !user.access.canCreate && !user.access.canCare) {
      throw new DomainError("Sem permissão para cadastrar visitantes");
    }

    const base = {
      crunchId: user.crunchId,
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      notes: body.notes || null,
    };

    if (body.status === "MEMBER") {
      return await $prismaClient.rosterMember.create({
        data: {
          ...base,
          status: "MEMBER",
          joinedAt: new Date(),
          // Membro cadastrado pela igreja: guarda a autorizacao so quando
          // ela foi dada (sem registro, membro pode receber contato).
          ...(body.contactConsent
            ? {
                visitorFollowUp: {
                  create: {
                    crunchId: user.crunchId,
                    stage: "INTEGRATED",
                    consentToContact: true,
                    activities: {
                      create: {
                        action: "CONSENT_UPDATED",
                        stage: "INTEGRATED",
                        note: "Contato digital autorizado.",
                        actorId: user.id,
                      },
                    },
                  },
                },
              }
            : {}),
        },
      });
    }

    return await $prismaClient.rosterMember.create({
      data: {
        ...base,
        status: "VISITOR",
        visitorFollowUp: {
          create: {
            crunchId: user.crunchId,
            consentToContact: body.contactConsent,
            activities: {
              create: {
                action: "FOLLOW_UP_STARTED",
                stage: "NEW",
                note: body.contactConsent
                  ? "Consentimento para contato confirmado no cadastro."
                  : "Contato digital ainda não autorizado.",
                actorId: user.id,
              },
            },
          },
        },
      },
    });
  }

  private async findOwned(id: string, crunchId: string) {
    const member = await $prismaClient.rosterMember.findUnique({ where: { id } });
    if (!member || member.crunchId !== crunchId) {
      throw new DomainError("Pessoa não encontrada no rol");
    }
    return member;
  }

  async update(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id: string };
    const member = await this.findOwned(id, user.crunchId);
    this.assertCanEdit(user, member);
    const body = updateSchema.parse(request.body);

    return await $prismaClient.rosterMember.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.email !== undefined ? { email: body.email || null } : {}),
        ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
        ...(body.birthDate !== undefined
          ? { birthDate: body.birthDate ? new Date(body.birthDate) : null }
          : {}),
        ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
      },
    });
  }

  async promote(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanChangeStatus(user);
    const { id } = request.params as { id: string };
    const member = await this.findOwned(id, user.crunchId);

    return await $prismaClient.$transaction(async (tx) => {
      const promoted = await tx.rosterMember.update({
        where: { id: member.id },
        data: { status: "MEMBER", joinedAt: new Date(), leftAt: null },
      });

      const followUp = await tx.visitorFollowUp.upsert({
        where: { rosterMemberId: member.id },
        create: {
          crunchId: user.crunchId,
          rosterMemberId: member.id,
          stage: "INTEGRATED",
        },
        update: { stage: "INTEGRATED", nextContactAt: null },
        select: { id: true, stage: true },
      });

      await tx.visitorFollowUpActivity.create({
        data: {
          followUpId: followUp.id,
          action: "BECAME_MEMBER",
          stage: "INTEGRATED",
          note: "Visitante integrado ao rol de membros.",
          actorId: user.id,
        },
      });

      return promoted;
    });
  }

  async markAsLeft(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanChangeStatus(user);
    const { id } = request.params as { id: string };
    const member = await this.findOwned(id, user.crunchId);

    return await $prismaClient.rosterMember.update({
      where: { id: member.id },
      data: { status: "FORMER", leftAt: new Date() },
    });
  }

  async restore(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanChangeStatus(user);
    const { id } = request.params as { id: string };
    const member = await this.findOwned(id, user.crunchId);

    return await $prismaClient.rosterMember.update({
      where: { id: member.id },
      // Volta pro que a pessoa era antes de sair: se tinha data de entrada,
      // era membro; senao, visitante.
      data: { status: member.joinedAt ? "MEMBER" : "VISITOR", leftAt: null },
    });
  }

  // Confere se o telefone cadastrado e um numero real de WhatsApp - mesmo
  // endpoint (`check-exists`) que o envio em massa usa antes de mandar
  // mensagem pra cada pessoa, so que sob demanda pra uma pessoa so.
  async checkWhatsAppNumber(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageRoster(user);
    const { id } = request.params as { id: string };
    const member = await this.findOwned(id, user.crunchId);

    if (!member.phone) {
      throw new DomainError("Pessoa não tem telefone cadastrado");
    }

    const connected = await WhatsAppServiceClient.isConnected(user.crunchId);
    if (!connected) {
      throw new DomainError("WhatsApp não conectado - conecte a igreja antes de verificar números");
    }

    const exists = await WhatsAppServiceClient.checkNumberExists(user.crunchId, member.phone);
    return { exists };
  }

  // "Registrar autorização": guarda se a pessoa autorizou contato por
  // WhatsApp/e-mail (LGPD). Vale para visitante, membro ou desligado - fica no
  // registro de acolhimento, que e criado quando ainda nao existe.
  async updateConsent(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    if (!user.access.canEdit && !user.access.canCare) {
      throw new DomainError("Sem permissão para registrar a autorização de contato");
    }
    const { id } = request.params as { id: string };
    const member = await this.findOwned(id, user.crunchId);
    const body = consentSchema.parse(request.body);
    const stage =
      member.status === "VISITOR" ? "NEW" : member.status === "MEMBER" ? "INTEGRATED" : "CLOSED";
    const note = [
      body.note?.trim() || null,
      body.consentToContact ? "Contato digital autorizado." : "Autorização para contato digital removida.",
    ]
      .filter(Boolean)
      .join(" ");

    return await $prismaClient.$transaction(async (tx) => {
      const followUp = await tx.visitorFollowUp.upsert({
        where: { rosterMemberId: member.id },
        create: {
          crunchId: user.crunchId,
          rosterMemberId: member.id,
          stage,
          consentToContact: body.consentToContact,
        },
        update: { consentToContact: body.consentToContact },
        select: { id: true, stage: true, consentToContact: true },
      });

      await tx.visitorFollowUpActivity.create({
        data: {
          followUpId: followUp.id,
          action: "CONSENT_UPDATED",
          stage: followUp.stage,
          note,
          actorId: user.id,
        },
      });

      return { rosterMemberId: member.id, consentToContact: followUp.consentToContact };
    });
  }

  async remove(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    if (!user.access.canDelete) {
      throw new DomainError("Sem permissão para excluir pessoas");
    }
    const { id } = request.params as { id: string };
    const member = await this.findOwned(id, user.crunchId);

    if (member.userId) {
      throw new DomainError("Pessoa com login no app não pode ser removida do rol - marque como desligada");
    }

    await $prismaClient.rosterMember.delete({ where: { id: member.id } });
    return { success: true };
  }
}
