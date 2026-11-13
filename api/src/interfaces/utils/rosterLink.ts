import { Prisma, PrismaClient } from "@prisma/client";
import { $prismaClient } from "../../../config/database";

// Todo ChurchMembership ativo precisa de um RosterMember (e o "registro da
// pessoa": visitas, acolhimento e presenca ficam pendurados nele). Aqui fica
// a regra de ligar a conta ao registro que ja existe - por id, e-mail ou
// telefone - em vez de criar uma pessoa duplicada no rol.

type Client = PrismaClient | Prisma.TransactionClient;

export type RosterLinkUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

export function phoneDigits(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  // Ignora o DDI 55 para "11 99999-8888" e "+55 11 99999-8888" baterem.
  return digits.length > 11 && digits.startsWith("55") ? digits.slice(2) : digits;
}

/**
 * Procura, nesta igreja, um registro do rol sem conta que seja a mesma pessoa
 * (mesmo e-mail ou mesmo telefone). Só devolve quando há exatamente um
 * candidato, para não ligar a conta à pessoa errada.
 */
export async function findLinkableRosterMember(
  client: Client,
  crunchId: string,
  user: { email?: string | null; phone?: string | null },
) {
  const email = user.email?.trim().toLowerCase() || null;
  const digits = phoneDigits(user.phone);
  if (!email && digits.length < 8) return null;

  const candidates = await client.rosterMember.findMany({
    where: {
      crunchId,
      userId: null,
      OR: [
        ...(email ? [{ email: { equals: email, mode: "insensitive" as const } }] : []),
        ...(digits.length >= 8 ? [{ phone: { not: null } }] : []),
      ],
    },
    select: { id: true, email: true, phone: true, status: true, joinedAt: true },
  });

  const matches = candidates.filter(
    (candidate) =>
      (email && candidate.email?.trim().toLowerCase() === email) ||
      (digits.length >= 8 && phoneDigits(candidate.phone) === digits),
  );

  return matches.length === 1 ? matches[0] : null;
}

/**
 * Garante o registro do rol para a conta `user` nesta igreja. Ordem:
 * 1. já existe registro com este userId → nada a fazer;
 * 2. `rosterMemberId` informado (ou um registro sem conta com o mesmo e-mail
 *    ou telefone) → liga a conta a ele;
 * 3. senão, cria um registro novo como membro.
 */
export async function ensureRosterMemberForUser(
  client: Client,
  crunchId: string,
  user: RosterLinkUser,
  options: { rosterMemberId?: string | null; joinedAt?: Date } = {},
) {
  const existing = await client.rosterMember.findUnique({
    where: { userId: user.id },
    select: { id: true, crunchId: true },
  });
  if (existing) return existing.crunchId === crunchId ? existing : null;

  let target: { id: string; status: string; joinedAt: Date | null } | null = null;

  if (options.rosterMemberId) {
    target = await client.rosterMember.findFirst({
      where: { id: options.rosterMemberId, crunchId, userId: null },
      select: { id: true, status: true, joinedAt: true },
    });
  }

  if (!target) {
    target = await findLinkableRosterMember(client, crunchId, user);
  }

  if (target) {
    return client.rosterMember.update({
      where: { id: target.id },
      data: {
        userId: user.id,
        // Quem estava desligado e ganhou acesso volta a ser membro.
        ...(target.status === "FORMER"
          ? { status: "MEMBER", leftAt: null, joinedAt: target.joinedAt ?? new Date() }
          : {}),
        ...(user.email ? { email: user.email } : {}),
      },
      select: { id: true, crunchId: true },
    });
  }

  return client.rosterMember.create({
    data: {
      crunchId,
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: "MEMBER",
      joinedAt: options.joinedAt ?? new Date(),
    },
    select: { id: true, crunchId: true },
  });
}

/**
 * Passada de auto-correção: contas ativas da igreja que ainda não têm
 * registro no rol (entraram por convite, criaram a igreja, foram adicionadas
 * pela plataforma…). Uma consulta só quando está tudo certo.
 */
export async function syncMissingRosterMembers(crunchId: string, client: Client = $prismaClient) {
  const memberships = await client.churchMembership.findMany({
    where: { crunchId, isActive: true, user: { rosterMember: { is: null } } },
    select: {
      createdAt: true,
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  for (const membership of memberships ?? []) {
    await ensureRosterMemberForUser(client, crunchId, membership.user, {
      joinedAt: membership.createdAt,
    });
  }
}
