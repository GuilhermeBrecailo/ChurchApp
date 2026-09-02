import { $prismaClient } from "../config/database";
import {
  classifyMembershipIntegrity,
  MembershipAuditUser,
} from "../src/application/Services/Auth/MembershipIntegrityAudit";

type AuditOptions = {
  email?: string;
  name?: string;
  churchId?: string;
  limit?: number;
  json: boolean;
};

type AuditResult = {
  user: MembershipAuditUser;
  churches: string[];
  issues: ReturnType<typeof classifyMembershipIntegrity>;
};

function parseArgs(args: string[]): AuditOptions {
  const options: AuditOptions = { json: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--json") {
      options.json = true;
      continue;
    }

    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Valor ausente para ${arg}`);
    }

    if (arg === "--email") options.email = value.trim().toLowerCase();
    else if (arg === "--name") options.name = value.trim();
    else if (arg === "--church-id") options.churchId = value.trim();
    else if (arg === "--limit") {
      const limit = Number(value);
      if (!Number.isInteger(limit) || limit < 1) {
        throw new Error("--limit deve ser um inteiro positivo");
      }
      options.limit = limit;
    } else {
      throw new Error(`Argumento desconhecido: ${arg}`);
    }

    index += 1;
  }

  if (options.email && options.name) {
    throw new Error("Use apenas um filtro entre --email e --name");
  }

  return options;
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@", 2);
  if (!local || !domain) return "***";
  return `${local.slice(0, 1)}***@${domain}`;
}

function shortId(id: string) {
  return id.length > 8 ? `…${id.slice(-8)}` : id;
}

function summarizeResult(result: AuditResult) {
  return {
    id: shortId(result.user.id),
    name: result.user.name,
    email: maskEmail(result.user.email),
    legacyChurchId: result.user.crunchId ? shortId(result.user.crunchId) : null,
    churches: result.churches,
    issues: result.issues,
  };
}

function printTextReport(
  options: AuditOptions,
  results: AuditResult[],
  totalMemberships: number,
  activeMemberships: number,
  assignedRoles: number,
) {
  const issueResults = results.filter((result) => result.issues.length > 0);
  const issueCounts = new Map<string, number>();

  for (const result of issueResults) {
    for (const issue of result.issues) {
      issueCounts.set(issue, (issueCounts.get(issue) ?? 0) + 1);
    }
  }

  console.log("Auditoria de integridade de vinculos e cargos (somente leitura)");
  console.log(`Usuarios analisados: ${results.length}`);
  if (options.limit) console.log(`Limite aplicado: ${options.limit}`);
  if (options.email) console.log(`Filtro: email ${maskEmail(options.email)}`);
  if (options.name) console.log(`Filtro: nome contendo ${options.name}`);
  if (options.churchId) console.log(`Filtro: igreja ${shortId(options.churchId)}`);
  console.log(`Vinculos encontrados: ${totalMemberships}`);
  console.log(`Vinculos ativos: ${activeMemberships}`);
  console.log(`Cargos atribuidos: ${assignedRoles}`);
  console.log(`Usuarios com inconsistencias: ${issueResults.length}`);

  if (issueCounts.size === 0) {
    console.log("Resultado: nenhuma inconsistência encontrada no recorte analisado.");
    return;
  }

  console.log("Tipos de inconsistência:");
  for (const [issue, count] of issueCounts) {
    console.log(`- ${issue}: ${count}`);
  }

  console.log("Usuarios para revisão:");
  for (const result of issueResults) {
    const summary = summarizeResult(result);
    console.log(
      `- ${summary.name} (${summary.email}, id ${summary.id}) — ${summary.issues.join(", ")}`,
    );
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const where = {
    ...(options.email ? { email: options.email } : {}),
    ...(options.name
      ? { name: { contains: options.name, mode: "insensitive" as const } }
      : {}),
    ...(options.churchId
      ? {
          OR: [
            { crunchId: options.churchId },
            { churchMemberships: { some: { crunchId: options.churchId } } },
          ],
        }
      : {}),
  };

  const users = await $prismaClient.user.findMany({
    where,
    orderBy: { name: "asc" },
    ...(options.limit ? { take: options.limit } : {}),
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      crunchId: true,
      churchMemberships: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          crunchId: true,
          role: true,
          isActive: true,
          isPrimary: true,
          crunch: { select: { name: true } },
          membershipRoles: {
            select: {
              churchRole: {
                select: {
                  id: true,
                  name: true,
                  crunchId: true,
                  scope: true,
                  departmentId: true,
                  permissions: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const results: AuditResult[] = users.map((user) => {
    const auditUser: MembershipAuditUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      crunchId: user.crunchId,
      memberships: user.churchMemberships.map((membership) => ({
        id: membership.id,
        crunchId: membership.crunchId,
        role: membership.role,
        isActive: membership.isActive,
        isPrimary: membership.isPrimary,
        membershipRoles: membership.membershipRoles,
      })),
    };

    return {
      user: auditUser,
      churches: user.churchMemberships.map((membership) => membership.crunch.name),
      issues: classifyMembershipIntegrity(auditUser),
    };
  });

  const totalMemberships = results.reduce(
    (total, result) => total + result.user.memberships.length,
    0,
  );
  const activeMemberships = results.reduce(
    (total, result) =>
      total + result.user.memberships.filter((membership) => membership.isActive).length,
    0,
  );
  const assignedRoles = results.reduce(
    (total, result) =>
      total +
      result.user.memberships.reduce(
        (membershipTotal, membership) =>
          membershipTotal + membership.membershipRoles.length,
        0,
      ),
    0,
  );

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          readOnly: true,
          usersAnalysed: results.length,
          totalMemberships,
          activeMemberships,
          assignedRoles,
          usersWithIssues: results.filter((result) => result.issues.length > 0).length,
          results: results.map(summarizeResult),
        },
        null,
        2,
      ),
    );
  } else {
    printTextReport(
      options,
      results,
      totalMemberships,
      activeMemberships,
      assignedRoles,
    );
  }
}

main()
  .catch(() => {
    console.error(
      "Não foi possível concluir a auditoria. Verifique a conexão configurada e tente novamente.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await $prismaClient.$disconnect();
  });
