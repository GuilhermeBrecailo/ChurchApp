# Gate de Planos (FREE/PRO/ILIMITADO) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o backend bloquear de fato as funcionalidades pagas por plano — hoje `Crunch.plan`/`subscriptionStatus`/`trialEndsAt` existem no schema mas nenhuma rota os lê.

**Architecture:** Uma matriz `PLAN_FEATURES` pura em `planConfig.ts` decide quem libera o quê; uma função `resolveEffectivePlan` deriva o plano de direito real (trial vencido ou assinatura cancelada caem pra FREE, mesmo com a coluna `plan` ainda em `"PRO"`); `resolveActiveChurchContext` (já chamado em todo request autenticado via `TenantHandler`) passa a anexar `hasFeature(feature)` ao `request.churchContext`; cada rota paga faz uma chamada a `hasFeature` e recusa via `DomainError` (contrato de erro já existente: vira HTTP 200 `{error, status:409}`).

**Tech Stack:** Fastify, Prisma, TypeScript, Jest (`jest --runInBand`, mocks de `$prismaClient` via `jest.mock`, sem banco real nos testes).

**Escopo desta parte:** só o gate de planos (schema, `planConfig.ts`, resolução de plano efetivo, `TenantHandler`/`churchContext`, aplicação nas rotas pagas, rota admin). A assinatura Mercado Pago (serviço, webhook, job de expiração de trial) é trabalho separado — ver `docs/superpowers/specs/2026-08-11-planos-billing-mercadopago-design.md`, seção "Divisão de trabalho".

**Fora de escopo (não implementado ainda, não dá pra gatear):** "Exportar escala como imagem" — `openspec/changes/export-scale-image/tasks.md` está com as 8 tasks desmarcadas, é feature 100% frontend (html2canvas) sem endpoint de backend. Volta pra este gate quando existir.

**Decisão de comportamento (confirmada com o usuário):** o broadcast de "notificações em massa" (push disparado quando um anúncio público é publicado ou uma oração é aprovada) é **silenciado** quando a igreja não tem a feature — a ação principal (publicar anúncio, aprovar oração) continua funcionando normalmente, só o push em massa não dispara. Não é um `DomainError` bloqueando a ação.

## Global Constraints

- Nomenclatura de plano: `"FREE" | "PRO" | "ILIMITADO"` — **não** `"PREMIUM"` (o schema já usa `"PRO"` no comentário e no valor gravado por `createOwnChurch`; o design doc foi corrigido pra bater com isso).
- Nenhum plano limita quantidade (membros, ministérios, escalas). A diferença é só a lista de features liberadas.
- `ILIMITADO` libera exatamente as mesmas features que `PRO` — é um selo manual, não um tier de venda.
- Recusa de feature paga é sempre `throw new DomainError("...")` — nunca `reply.code(403)` direto. O `controllerHandler` já converte isso pra HTTP 200 `{error, status:409}`.
- Prisma sempre mockado nos testes (`jest.mock("../config/database", () => ({ $prismaClient: mockPrismaClient }))`) — nunca banco real.
- Rodar teste único a partir de `api/`: `npx jest tests/<arquivo>.test.ts`. Rodar tudo a partir da raiz: `npm run api:test`.

---

### Task 1: Limpar campo Mercado Pago duplicado no schema

O schema tem dois campos pro ID da assinatura do Mercado Pago (`mpSubscriptionId` e `mpPreapprovalId`), ambos adicionados na mesma migration, nenhum usado em código nenhum ainda. O design doc documenta só `mpSubscriptionId` — mantemos esse e derrubamos o duplicado antes que o time do Mercado Pago construa em cima de um schema ambíguo.

**Files:**
- Modify: `api/src/infrastructure/database/prisma/schema.prisma:44` (remover linha `mpPreapprovalId String?`)
- Create: nova migration gerada por `prisma migrate dev` em `api/src/infrastructure/database/prisma/migrations/`

**Interfaces:**
- Produces: nenhuma mudança de tipo TypeScript (campo nunca foi referenciado em código).

- [ ] **Step 1: Remover o campo duplicado do schema**

Em `api/src/infrastructure/database/prisma/schema.prisma`, dentro do `model Crunch`, remover a linha 44:

```prisma
    mpSubscriptionId   String?
    mpPreapprovalId    String?
```
vira:
```prisma
    mpSubscriptionId   String?
```

- [ ] **Step 2: Confirmar que não há nenhuma referência ao campo removido**

Run: `cd api && grep -rn "mpPreapprovalId" src/`
Expected: nenhum resultado (exit code 1 do grep).

- [ ] **Step 3: Gerar a migration**

Run (a partir de `api/`): `npx prisma migrate dev --name drop_duplicate_mp_id`
Expected: cria uma pasta nova em `migrations/` com um `migration.sql` contendo `ALTER TABLE "Crunch" DROP COLUMN "mpPreapprovalId";`, e reaplica no banco de dev sem erro.

- [ ] **Step 4: Commit**

```bash
git add api/src/infrastructure/database/prisma/schema.prisma api/src/infrastructure/database/prisma/migrations
git commit -m "chore: remove duplicate mpPreapprovalId column from Crunch"
```

---

### Task 2: `planConfig.ts` — matriz de features e resolução de plano efetivo

**Files:**
- Create: `api/src/domain/planConfig.ts`
- Test: `api/tests/planConfig.test.ts`

**Interfaces:**
- Produces: `Plan` (`"FREE" | "PRO" | "ILIMITADO"`), `PLANS: Plan[]`, `PlanFeature` (union de 9 strings), `PLAN_FEATURES: Record<Plan, PlanFeature[]>`, `CrunchPlanFields` (`{plan: string; subscriptionStatus: string; trialEndsAt: Date | null}`), `resolveEffectivePlan(crunch: CrunchPlanFields): Plan`, `hasFeature(crunch: CrunchPlanFields, feature: PlanFeature): boolean`. Usado por: Task 3 (`churchContext.ts`), Task 4 (`adminAdapters.ts` valida `PLANS`).

- [ ] **Step 1: Escrever os testes (falhando)**

Criar `api/tests/planConfig.test.ts`:

```ts
import { resolveEffectivePlan, hasFeature, PLAN_FEATURES } from "../src/domain/planConfig";

describe("resolveEffectivePlan", () => {
  it("returns FREE for a church that never upgraded", () => {
    expect(
      resolveEffectivePlan({ plan: "FREE", subscriptionStatus: "TRIALING", trialEndsAt: null }),
    ).toBe("FREE");
  });

  it("returns PRO for an active subscription", () => {
    expect(
      resolveEffectivePlan({ plan: "PRO", subscriptionStatus: "ACTIVE", trialEndsAt: null }),
    ).toBe("PRO");
  });

  it("returns PRO during a trial that has not expired", () => {
    const trialEndsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(
      resolveEffectivePlan({ plan: "PRO", subscriptionStatus: "TRIALING", trialEndsAt }),
    ).toBe("PRO");
  });

  it("returns FREE when the trial has expired", () => {
    const trialEndsAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(
      resolveEffectivePlan({ plan: "PRO", subscriptionStatus: "TRIALING", trialEndsAt }),
    ).toBe("FREE");
  });

  it("returns FREE when the subscription was canceled", () => {
    expect(
      resolveEffectivePlan({ plan: "PRO", subscriptionStatus: "CANCELED", trialEndsAt: null }),
    ).toBe("FREE");
  });

  it("returns FREE when the subscription expired", () => {
    expect(
      resolveEffectivePlan({ plan: "PRO", subscriptionStatus: "EXPIRED", trialEndsAt: null }),
    ).toBe("FREE");
  });

  it("returns FREE when payment is past due", () => {
    expect(
      resolveEffectivePlan({ plan: "PRO", subscriptionStatus: "PAST_DUE", trialEndsAt: null }),
    ).toBe("FREE");
  });

  it("returns ILIMITADO regardless of subscriptionStatus or trialEndsAt", () => {
    const trialEndsAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(
      resolveEffectivePlan({ plan: "ILIMITADO", subscriptionStatus: "CANCELED", trialEndsAt }),
    ).toBe("ILIMITADO");
  });
});

describe("hasFeature", () => {
  it("denies every paid feature on FREE", () => {
    const free = { plan: "FREE", subscriptionStatus: "TRIALING", trialEndsAt: null };
    expect(hasFeature(free, "REPORTS")).toBe(false);
    expect(hasFeature(free, "CUSTOM_ROLES")).toBe(false);
  });

  it("grants every feature in PLAN_FEATURES.PRO to an active PRO church", () => {
    const pro = { plan: "PRO", subscriptionStatus: "ACTIVE", trialEndsAt: null };
    for (const feature of PLAN_FEATURES.PRO) {
      expect(hasFeature(pro, feature)).toBe(true);
    }
  });

  it("grants the same features to ILIMITADO as to PRO", () => {
    const ilimitado = { plan: "ILIMITADO", subscriptionStatus: "CANCELED", trialEndsAt: null };
    for (const feature of PLAN_FEATURES.PRO) {
      expect(hasFeature(ilimitado, feature)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run (de `api/`): `npx jest tests/planConfig.test.ts`
Expected: FAIL com `Cannot find module '../src/domain/planConfig'`.

- [ ] **Step 3: Implementar `planConfig.ts`**

Criar `api/src/domain/planConfig.ts`:

```ts
// Matriz plano -> funcionalidades liberadas. FREE nao libera nenhuma feature
// paga; PRO e ILIMITADO liberam as mesmas (ILIMITADO e um selo manual do
// admin da plataforma, sem cobranca, nao um tier de venda - ver
// docs/superpowers/specs/2026-08-11-planos-billing-mercadopago-design.md).

export type Plan = "FREE" | "PRO" | "ILIMITADO";

export const PLANS: Plan[] = ["FREE", "PRO", "ILIMITADO"];

export type PlanFeature =
  | "CUSTOM_PUBLIC_PAGE"
  | "CUSTOM_ROLES"
  | "MINISTRY_RESOURCES"
  | "SCHEDULE_REMINDER"
  | "CIFRA_CLUB_IMPORT"
  | "PDF_SONG_IMPORT"
  | "DEVOTIONAL_PROGRESS"
  | "MASS_NOTIFICATIONS"
  | "REPORTS";

const PRO_FEATURES: PlanFeature[] = [
  "CUSTOM_PUBLIC_PAGE",
  "CUSTOM_ROLES",
  "MINISTRY_RESOURCES",
  "SCHEDULE_REMINDER",
  "CIFRA_CLUB_IMPORT",
  "PDF_SONG_IMPORT",
  "DEVOTIONAL_PROGRESS",
  "MASS_NOTIFICATIONS",
  "REPORTS",
];

export const PLAN_FEATURES: Record<Plan, PlanFeature[]> = {
  FREE: [],
  PRO: PRO_FEATURES,
  ILIMITADO: PRO_FEATURES,
};

export type CrunchPlanFields = {
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: Date | null;
};

// Deriva o plano de direito real. Nunca ler `plan`/`subscriptionStatus` crus
// fora daqui - trial vencido ou assinatura cancelada derrubam o acesso mesmo
// que o job de expiracao ainda nao tenha rodado.
export function resolveEffectivePlan(crunch: CrunchPlanFields): Plan {
  if (crunch.plan === "ILIMITADO") return "ILIMITADO";
  if (crunch.plan !== "PRO") return "FREE";
  if (crunch.subscriptionStatus === "ACTIVE") return "PRO";
  if (
    crunch.subscriptionStatus === "TRIALING" &&
    crunch.trialEndsAt !== null &&
    crunch.trialEndsAt.getTime() > Date.now()
  ) {
    return "PRO";
  }
  return "FREE";
}

export function hasFeature(crunch: CrunchPlanFields, feature: PlanFeature): boolean {
  const effectivePlan = resolveEffectivePlan(crunch);
  return PLAN_FEATURES[effectivePlan].includes(feature);
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx jest tests/planConfig.test.ts`
Expected: PASS, 11 testes.

- [ ] **Step 5: Commit**

```bash
git add api/src/domain/planConfig.ts api/tests/planConfig.test.ts
git commit -m "feat: add plan/feature matrix and effective plan resolution"
```

---

### Task 3: Anexar `hasFeature` ao `request.churchContext`

**Files:**
- Modify: `api/src/interfaces/utils/churchContext.ts` (arquivo inteiro — reescrita, ~130 linhas)
- Test: `api/tests/churchContext.test.ts`

**Interfaces:**
- Consumes: `hasFeature(crunch, feature)` e `PlanFeature` de `../../domain/planConfig` (Task 2).
- Produces: `ActiveChurchContext.hasFeature: (feature: PlanFeature) => boolean`. Usado por toda rota paga (Tasks 5-10) via `request.churchContext.hasFeature(...)`.

- [ ] **Step 1: Escrever o teste (falhando)**

Criar `api/tests/churchContext.test.ts`:

```ts
const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  crunch: { findUnique: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import { FastifyRequest } from "fastify";
import { resolveActiveChurchContext } from "../src/interfaces/utils/churchContext";

function makeRequest(): FastifyRequest {
  return { headers: {} } as unknown as FastifyRequest;
}

describe("resolveActiveChurchContext - hasFeature", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("denies every feature when the user has no active church", async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      crunchId: null,
      role: "MEMBRO",
      canManageMembers: false,
      churchMemberships: [],
    });

    const context = await resolveActiveChurchContext(makeRequest(), "user-1");

    expect(context.activeChurchId).toBeNull();
    expect(context.hasFeature("REPORTS")).toBe(false);
    expect(mockPrismaClient.crunch.findUnique).not.toHaveBeenCalled();
  });

  it("denies paid features when the active church is on FREE", async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      crunchId: null,
      role: "PASTOR",
      canManageMembers: true,
      churchMemberships: [
        {
          crunchId: "church-1",
          role: "PASTOR",
          canManageMembers: true,
          id: "membership-1",
          membershipRoles: [],
        },
      ],
    });
    mockPrismaClient.crunch.findUnique.mockResolvedValue({
      plan: "FREE",
      subscriptionStatus: "TRIALING",
      trialEndsAt: null,
    });

    const context = await resolveActiveChurchContext(makeRequest(), "user-1");

    expect(context.activeChurchId).toBe("church-1");
    expect(context.hasFeature("REPORTS")).toBe(false);
  });

  it("grants paid features when the active church has an active PRO subscription", async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      crunchId: null,
      role: "PASTOR",
      canManageMembers: true,
      churchMemberships: [
        {
          crunchId: "church-1",
          role: "PASTOR",
          canManageMembers: true,
          id: "membership-1",
          membershipRoles: [],
        },
      ],
    });
    mockPrismaClient.crunch.findUnique.mockResolvedValue({
      plan: "PRO",
      subscriptionStatus: "ACTIVE",
      trialEndsAt: null,
    });

    const context = await resolveActiveChurchContext(makeRequest(), "user-1");

    expect(context.hasFeature("REPORTS")).toBe(true);
  });

  it("denies every feature when the active church's Crunch record is missing", async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      crunchId: "church-1",
      role: "PASTOR",
      canManageMembers: true,
      churchMemberships: [],
    });
    mockPrismaClient.crunch.findUnique.mockResolvedValue(null);

    const context = await resolveActiveChurchContext(makeRequest(), "user-1");

    expect(context.hasFeature("REPORTS")).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx jest tests/churchContext.test.ts`
Expected: FAIL — `context.hasFeature is not a function`.

- [ ] **Step 3: Reescrever `churchContext.ts`**

Substituir o conteúdo inteiro de `api/src/interfaces/utils/churchContext.ts` por:

```ts
import { FastifyRequest } from "fastify";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { hasFeature, PlanFeature } from "../../domain/planConfig";

export type RoleContext = {
  id: string;
  name: string;
  scope: string;
  departmentId: string | null;
  permissions: string[];
};

export type ActiveChurchContext = {
  activeChurchId: string | null;
  role: string;
  canManageMembers: boolean;
  roles: RoleContext[];
  membershipId: string | null;
  hasFeature: (feature: PlanFeature) => boolean;
};

function getHeaderValue(request: FastifyRequest, name: string) {
  const value = request.headers[name.toLowerCase()];

  if (Array.isArray(value)) return value[0];
  return value;
}

export function getRequestedChurchId(request: FastifyRequest) {
  return (
    getHeaderValue(request, "x-church-id") ||
    getHeaderValue(request, "x-active-church-id") ||
    null
  );
}

function mapRoles(
  membershipRoles: {
    churchRole: {
      id: string;
      name: string;
      scope: string;
      departmentId: string | null;
      permissions: string[];
    };
  }[],
): RoleContext[] {
  return membershipRoles.map((mr) => ({
    id: mr.churchRole.id,
    name: mr.churchRole.name,
    scope: mr.churchRole.scope,
    departmentId: mr.churchRole.departmentId,
    permissions: mr.churchRole.permissions,
  }));
}

async function buildHasFeature(
  crunchId: string | null,
): Promise<(feature: PlanFeature) => boolean> {
  if (!crunchId) return () => false;

  const crunch = await $prismaClient.crunch.findUnique({
    where: { id: crunchId },
    select: { plan: true, subscriptionStatus: true, trialEndsAt: true },
  });

  if (!crunch) return () => false;

  return (feature: PlanFeature) => hasFeature(crunch, feature);
}

export async function resolveActiveChurchContext(
  request: FastifyRequest,
  userId: string,
): Promise<ActiveChurchContext> {
  const requestedChurchId = getRequestedChurchId(request);
  const user = await $prismaClient.user.findUnique({
    where: { id: userId },
    include: {
      churchMemberships: {
        where: { isActive: true },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        include: {
          membershipRoles: {
            include: {
              churchRole: {
                select: {
                  id: true,
                  name: true,
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

  if (!user) {
    throw new DomainError("Usuário não encontrado");
  }

  const membership = requestedChurchId
    ? user.churchMemberships.find((item) => item.crunchId === requestedChurchId)
    : user.churchMemberships[0] ?? null;

  if (requestedChurchId && !membership) {
    throw new DomainError("Usuário não possui vínculo ativo com esta igreja");
  }

  const base = membership
    ? {
        activeChurchId: membership.crunchId,
        role: membership.role,
        canManageMembers: membership.canManageMembers,
        roles: mapRoles(membership.membershipRoles),
        membershipId: membership.id,
      }
    : user.crunchId
      ? {
          activeChurchId: user.crunchId,
          role: user.role,
          canManageMembers: user.canManageMembers,
          roles: [],
          membershipId: null,
        }
      : {
          activeChurchId: null,
          role: user.role,
          canManageMembers: user.canManageMembers,
          roles: [],
          membershipId: null,
        };

  return {
    ...base,
    hasFeature: await buildHasFeature(base.activeChurchId),
  };
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx jest tests/churchContext.test.ts`
Expected: PASS, 4 testes.

- [ ] **Step 5: Rodar a suíte inteira pra checar regressão**

Run (da raiz): `npm run api:test`
Expected: PASS em todos os arquivos — nenhum outro teste depende do formato antigo de `ActiveChurchContext` (nenhum teste existente monta esse objeto manualmente sem passar por `resolveActiveChurchContext`; onde é mockado direto em `prayerAdapters.test.ts`, é como `churchContext: { ... }` sem `hasFeature`, e nenhum código atual chama `.hasFeature` ainda nesta task).

- [ ] **Step 6: Commit**

```bash
git add api/src/interfaces/utils/churchContext.ts api/tests/churchContext.test.ts
git commit -m "feat: attach hasFeature to the active church context"
```

---

### Task 4: Rota admin para atribuir plano Ilimitado

**Files:**
- Modify: `api/src/interfaces/adapters/adminAdapters.ts` (adicionar import + método `setChurchPlan`)
- Modify: `api/src/interfaces/routes/AdminRoutes.ts:1-37` (registrar rota)
- Test: `api/tests/adminAdapters.test.ts` (novo arquivo)

**Interfaces:**
- Consumes: `PLANS`, `Plan` de `../../domain/planConfig` (Task 2); `assertPlatformAdmin` (já existe em `adminAdapters.ts:34`).
- Produces: `PATCH /api/admin/churches/:id/plan`, body `{ plan: "FREE" | "PRO" | "ILIMITADO" }`.

- [ ] **Step 1: Escrever o teste (falhando)**

Criar `api/tests/adminAdapters.test.ts`:

```ts
const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  crunch: { findUnique: jest.fn(), update: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import { FastifyRequest } from "fastify";
import { AdminAdapters } from "../src/interfaces/adapters/adminAdapters";
import { DomainError } from "../src/domain/value-objects/utils/DomainError";

function fakeAdminToken(overrides: Record<string, unknown> = {}) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ sub: "admin-1", is_admin: true, ...overrides }),
  ).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(options: {
  token?: string;
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${options.token ?? fakeAdminToken()}` },
    params: options.params ?? {},
    body: options.body ?? {},
  } as unknown as FastifyRequest;
}

describe("AdminAdapters.setChurchPlan", () => {
  let adapters: AdminAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new AdminAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({ id: "admin-1", role: "SUPER_ADMIN" });
  });

  it("rejects a non-admin caller", async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({ id: "user-1", role: "PASTOR" });
    const request = makeRequest({
      token: fakeAdminToken({ sub: "user-1", is_admin: false }),
      params: { id: "church-1" },
      body: { plan: "ILIMITADO" },
    });

    await expect(adapters.setChurchPlan(request)).rejects.toThrow(DomainError);
  });

  it("rejects an invalid plan value", async () => {
    const request = makeRequest({ params: { id: "church-1" }, body: { plan: "GOLD" } });

    await expect(adapters.setChurchPlan(request)).rejects.toThrow(DomainError);
  });

  it("rejects when the church does not exist", async () => {
    mockPrismaClient.crunch.findUnique.mockResolvedValue(null);
    const request = makeRequest({ params: { id: "church-404" }, body: { plan: "ILIMITADO" } });

    await expect(adapters.setChurchPlan(request)).rejects.toThrow(DomainError);
  });

  it("updates the church plan to ILIMITADO", async () => {
    mockPrismaClient.crunch.findUnique.mockResolvedValue({ id: "church-1" });
    mockPrismaClient.crunch.update.mockResolvedValue({
      id: "church-1",
      name: "Igreja Central",
      plan: "ILIMITADO",
      subscriptionStatus: "TRIALING",
      trialEndsAt: null,
    });
    const request = makeRequest({ params: { id: "church-1" }, body: { plan: "ILIMITADO" } });

    const result = await adapters.setChurchPlan(request);

    expect(mockPrismaClient.crunch.update).toHaveBeenCalledWith({
      where: { id: "church-1" },
      data: { plan: "ILIMITADO" },
      select: {
        id: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
      },
    });
    expect(result.plan).toBe("ILIMITADO");
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx jest tests/adminAdapters.test.ts`
Expected: FAIL — `adapters.setChurchPlan is not a function`.

- [ ] **Step 3: Implementar `setChurchPlan`**

Em `api/src/interfaces/adapters/adminAdapters.ts`, adicionar o import no topo (junto aos outros, após a linha 4):

```ts
import { PLANS, Plan } from "../../domain/planConfig";
```

E adicionar o método dentro de `export class AdminAdapters { ... }` (pode ir logo após `getChurchById`, por volta da linha 171 em diante — não precisa ser exatamente ali, qualquer lugar dentro da classe funciona):

```ts
  async setChurchPlan(request: FastifyRequest) {
    await assertPlatformAdmin(request);

    const { id } = request.params as { id?: string };
    const body = request.body as { plan?: string };

    if (!id) {
      throw new DomainError("Igreja não informada");
    }

    if (!body.plan || !PLANS.includes(body.plan as Plan)) {
      throw new DomainError(`Plano inválido. Use um de: ${PLANS.join(", ")}`);
    }

    const church = await $prismaClient.crunch.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!church) {
      throw new DomainError("Igreja não encontrada");
    }

    return await $prismaClient.crunch.update({
      where: { id },
      data: { plan: body.plan },
      select: {
        id: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
      },
    });
  }
```

- [ ] **Step 4: Registrar a rota**

Em `api/src/interfaces/routes/AdminRoutes.ts`, adicionar (após a rota `GET /api/admin/churches/:id`, antes das rotas de usuário):

```ts
  app.patch(
    "/api/admin/churches/:id/plan",
    controllerHandler(adapters.setChurchPlan.bind(adapters)),
  );
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `npx jest tests/adminAdapters.test.ts`
Expected: PASS, 4 testes.

- [ ] **Step 6: Commit**

```bash
git add api/src/interfaces/adapters/adminAdapters.ts api/src/interfaces/routes/AdminRoutes.ts api/tests/adminAdapters.test.ts
git commit -m "feat: add admin route to set a church's plan"
```

---

### Task 5: Gate de papéis customizados (`CUSTOM_ROLES`)

**Files:**
- Modify: `api/src/interfaces/adapters/churchRoleAdapters.ts:152,186,240` (início de `createRole`, `updateRole`, `deleteRole`)
- Test: `api/tests/churchRoleAdapters.test.ts` (novo arquivo)

**Interfaces:**
- Consumes: `request.churchContext.hasFeature("CUSTOM_ROLES")` (Task 3). `getRoles`, `addMemberRole`, `removeMemberRole` **não** são gateados — atribuir um cargo já existente a um membro é operação básica, não "customização".

- [ ] **Step 1: Escrever o teste (falhando)**

Criar `api/tests/churchRoleAdapters.test.ts`:

```ts
const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  churchRole: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  },
  department: { findFirst: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import { FastifyRequest } from "fastify";
import { ChurchRoleAdapters } from "../src/interfaces/adapters/churchRoleAdapters";
import { DomainError } from "../src/domain/value-objects/utils/DomainError";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(options: {
  userId?: string;
  hasFeature: boolean;
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken(options.userId ?? "pastor-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role: "PASTOR",
      canManageMembers: true,
      roles: [],
      membershipId: "membership-1",
      hasFeature: () => options.hasFeature,
    },
    params: options.params ?? {},
    body: options.body ?? {},
  } as unknown as FastifyRequest;
}

describe("ChurchRoleAdapters plan gate", () => {
  let adapters: ChurchRoleAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new ChurchRoleAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "pastor-1",
      crunchId: "church-1",
      role: "PASTOR",
    });
  });

  it("blocks createRole on a FREE church", async () => {
    const request = makeRequest({ hasFeature: false, body: { name: "Diácono" } });

    await expect(adapters.createRole(request)).rejects.toThrow(DomainError);
    expect(mockPrismaClient.churchRole.create).not.toHaveBeenCalled();
  });

  it("allows createRole on a PRO church", async () => {
    mockPrismaClient.churchRole.create.mockResolvedValue({ id: "role-1", name: "Diácono" });
    const request = makeRequest({ hasFeature: true, body: { name: "Diácono" } });

    await adapters.createRole(request);

    expect(mockPrismaClient.churchRole.create).toHaveBeenCalled();
  });

  it("blocks updateRole on a FREE church", async () => {
    const request = makeRequest({ hasFeature: false, params: { id: "role-1" }, body: { name: "X" } });

    await expect(adapters.updateRole(request)).rejects.toThrow(DomainError);
    expect(mockPrismaClient.churchRole.findFirst).not.toHaveBeenCalled();
  });

  it("blocks deleteRole on a FREE church", async () => {
    const request = makeRequest({ hasFeature: false, params: { id: "role-1" } });

    await expect(adapters.deleteRole(request)).rejects.toThrow(DomainError);
    expect(mockPrismaClient.churchRole.delete).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx jest tests/churchRoleAdapters.test.ts`
Expected: FAIL — os testes "blocks..." falham porque hoje nada impede a operação numa igreja FREE (o mock do Prisma acaba sendo chamado).

- [ ] **Step 3: Adicionar o gate nos três métodos**

Em `api/src/interfaces/adapters/churchRoleAdapters.ts`, `createRole` (linha 152) passa de:

```ts
  async createRole(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertIsChurchManager(user);
```
para:
```ts
  async createRole(request: FastifyRequest) {
    if (!request.churchContext?.hasFeature("CUSTOM_ROLES")) {
      throw new DomainError("Papéis customizados estão disponíveis apenas no plano Pro");
    }
    const user = await this.getCurrentUser(request);
    this.assertIsChurchManager(user);
```

`updateRole` (linha 186) passa de:
```ts
  async updateRole(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertIsChurchManager(user);
```
para:
```ts
  async updateRole(request: FastifyRequest) {
    if (!request.churchContext?.hasFeature("CUSTOM_ROLES")) {
      throw new DomainError("Papéis customizados estão disponíveis apenas no plano Pro");
    }
    const user = await this.getCurrentUser(request);
    this.assertIsChurchManager(user);
```

`deleteRole` (linha 240) passa de:
```ts
  async deleteRole(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertIsChurchManager(user);
```
para:
```ts
  async deleteRole(request: FastifyRequest) {
    if (!request.churchContext?.hasFeature("CUSTOM_ROLES")) {
      throw new DomainError("Papéis customizados estão disponíveis apenas no plano Pro");
    }
    const user = await this.getCurrentUser(request);
    this.assertIsChurchManager(user);
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx jest tests/churchRoleAdapters.test.ts`
Expected: PASS, 4 testes.

- [ ] **Step 5: Commit**

```bash
git add api/src/interfaces/adapters/churchRoleAdapters.ts api/tests/churchRoleAdapters.test.ts
git commit -m "feat: gate custom church roles behind the Pro plan"
```

---

### Task 6: Gate de personalização da página pública (`CUSTOM_PUBLIC_PAGE`)

Gate por campo, não por rota inteira: `PATCH /api/church` atualiza dados básicos (nome, endereço — sempre Free) e campos de aparência (`logo`, `accentColor`, `textColor`, `fontFamily` — Pro, conforme `openspec/changes/church-appearance/proposal.md`) no mesmo body. Só bloqueia se o body tentar mudar algum campo de aparência.

**Files:**
- Modify: `api/src/interfaces/adapters/userAdapters.ts:649-869` (`updateOwnChurch`)
- Test: `api/tests/userAdapters.test.ts` (criar se não existir — checar antes com `ls api/tests/userAdapters.test.ts`; se já existir, adicionar os `describe` novos nele em vez de recriar o arquivo)

**Interfaces:**
- Consumes: `context.hasFeature("CUSTOM_PUBLIC_PAGE")`, onde `context` já é `request.churchContext ?? resolveActiveChurchContext(...)` (padrão já existente nas linhas 727-728 e 798-799).

- [ ] **Step 1: Checar se `api/tests/userAdapters.test.ts` já existe**

Run: `ls api/tests/ | grep -i user`
Expected: mostra `user.test.ts` (arquivo de domínio, não de adapter — confirmado pela pesquisa prévia). Não existe `userAdapters.test.ts` — criar um novo.

- [ ] **Step 2: Escrever o teste (falhando)**

Criar `api/tests/userAdapters.test.ts`:

```ts
const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  crunch: { update: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import { FastifyRequest } from "fastify";
import { UserAdapters } from "../src/interfaces/adapters/userAdapters";
import { DomainError } from "../src/domain/value-objects/utils/DomainError";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(options: {
  hasFeature: boolean;
  body: Record<string, unknown>;
}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("pastor-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role: "PASTOR",
      canManageMembers: true,
      roles: [],
      membershipId: "membership-1",
      hasFeature: () => options.hasFeature,
    },
    params: {},
    body: options.body,
  } as unknown as FastifyRequest;
}

describe("UserAdapters.updateOwnChurch plan gate", () => {
  let adapters: UserAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new UserAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "pastor-1",
      crunchId: "church-1",
      crunch: { id: "church-1" },
    });
  });

  it("blocks accentColor change on a FREE church", async () => {
    const request = makeRequest({ hasFeature: false, body: { accentColor: "#FF0000" } });

    await expect(adapters.updateOwnChurch(request)).rejects.toThrow(DomainError);
    expect(mockPrismaClient.crunch.update).not.toHaveBeenCalled();
  });

  it("blocks fontFamily change on a FREE church", async () => {
    const request = makeRequest({ hasFeature: false, body: { fontFamily: "inter" } });

    await expect(adapters.updateOwnChurch(request)).rejects.toThrow(DomainError);
  });

  it("allows basic fields (name) on a FREE church", async () => {
    mockPrismaClient.crunch.update.mockResolvedValue({ id: "church-1", name: "Nova Igreja" });
    const request = makeRequest({ hasFeature: false, body: { name: "Nova Igreja" } });

    await adapters.updateOwnChurch(request);

    expect(mockPrismaClient.crunch.update).toHaveBeenCalled();
  });

  it("allows appearance fields on a PRO church", async () => {
    mockPrismaClient.crunch.update.mockResolvedValue({ id: "church-1", accentColor: "#FF0000" });
    const request = makeRequest({ hasFeature: true, body: { accentColor: "#FF0000" } });

    await adapters.updateOwnChurch(request);

    expect(mockPrismaClient.crunch.update).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `npx jest tests/userAdapters.test.ts`
Expected: FAIL nos dois primeiros testes (nada bloqueia hoje).

- [ ] **Step 4: Adicionar `wantsAppearanceChange` e o gate nas duas branches**

Em `api/src/interfaces/adapters/userAdapters.ts`, logo após o bloco que calcula `appearanceSelect` (linhas 712-715):

```ts
    const appearanceSelect = {
      textColor: true,
      fontFamily: true,
    } as const;
```
adicionar logo abaixo:
```ts
    const wantsAppearanceChange =
      body.logo !== undefined ||
      body.accentColor !== undefined ||
      body.textColor !== undefined ||
      body.fontFamily !== undefined;
```

Na primeira branch, logo após a checagem `canEditChurch` (linhas 739-741):
```ts
      if (!canEditChurch) {
        throw new DomainError("Apenas pastores ou admins podem editar a igreja");
      }
```
adicionar:
```ts
      if (!canEditChurch) {
        throw new DomainError("Apenas pastores ou admins podem editar a igreja");
      }

      if (wantsAppearanceChange && !context.hasFeature("CUSTOM_PUBLIC_PAGE")) {
        throw new DomainError(
          "Personalização da página pública está disponível apenas no plano Pro",
        );
      }
```

Na segunda branch (principal), logo após a checagem `canEditChurch` equivalente (linhas 810-812):
```ts
    if (!canEditChurch) {
      throw new DomainError("Apenas pastores ou admins podem editar a igreja");
    }
```
adicionar:
```ts
    if (!canEditChurch) {
      throw new DomainError("Apenas pastores ou admins podem editar a igreja");
    }

    if (wantsAppearanceChange && !context.hasFeature("CUSTOM_PUBLIC_PAGE")) {
      throw new DomainError(
        "Personalização da página pública está disponível apenas no plano Pro",
      );
    }
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `npx jest tests/userAdapters.test.ts`
Expected: PASS, 4 testes.

- [ ] **Step 6: Rodar a suíte inteira pra checar regressão**

Run (da raiz): `npm run api:test`
Expected: PASS em tudo.

- [ ] **Step 7: Commit**

```bash
git add api/src/interfaces/adapters/userAdapters.ts api/tests/userAdapters.test.ts
git commit -m "feat: gate public page appearance customization behind the Pro plan"
```

---

### Task 7: Gate das features de ministério (`MINISTRY_RESOURCES`, `SCHEDULE_REMINDER`, `CIFRA_CLUB_IMPORT`, `PDF_SONG_IMPORT`)

Quatro sub-features, todas em `churchDepartmentAdapters.ts`, mesmo padrão mecânico (`if (!id) throw ...` seguido de uma checagem de permissão) — um só task cobre as quatro porque é o mesmo arquivo e o mesmo tipo de edição de uma linha.

**Files:**
- Modify: `api/src/interfaces/adapters/churchDepartmentAdapters.ts:658` (`uploadChurchDepartmentPdf`), `:1631` (`sendChurchScheduleReminder`), `:2255` (`importCifraClubSong`), `:2413` (`previewSongsFromPdf`), `:2469` (`importSongsFromPdf`), `:2819` (`createChurchDepartmentResource`)
- Test: `api/tests/churchDepartmentPlanGate.test.ts` (novo arquivo — não `churchDepartmentAdapters.test.ts` pra não colidir se já existir um arquivo de teste maior desse adapter; checar antes)

**Interfaces:**
- Consumes: `request.churchContext.hasFeature(...)` (Task 3). PATCH/DELETE de recurso existente (`updateChurchDepartmentResource`, `deleteChurchDepartmentResource`) e as rotas de escala/tarefa/membro normais **não** são gateadas — só a criação/importação.

- [ ] **Step 1: Checar se já existe teste desse adapter**

Run: `ls api/tests/ | grep -i department`
Expected: mostra `departament.test.ts` e `departmentModules.test.ts` (arquivos de domínio, não deste adapter). Criar `api/tests/churchDepartmentPlanGate.test.ts` novo.

- [ ] **Step 2: Escrever os testes (falhando)**

Criar `api/tests/churchDepartmentPlanGate.test.ts`:

```ts
const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  department: { findFirst: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import { FastifyRequest } from "fastify";
import { ChurchDepartmentAdapters } from "../src/interfaces/adapters/churchDepartmentAdapters";
import { DomainError } from "../src/domain/value-objects/utils/DomainError";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(options: {
  hasFeature: boolean;
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("pastor-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role: "PASTOR",
      canManageMembers: true,
      roles: [],
      membershipId: "membership-1",
      hasFeature: () => options.hasFeature,
    },
    params: options.params ?? {},
    body: options.body ?? {},
    query: {},
  } as unknown as FastifyRequest;
}

describe("ChurchDepartmentAdapters plan gate", () => {
  let adapters: ChurchDepartmentAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new ChurchDepartmentAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "pastor-1",
      crunchId: "church-1",
      role: "PASTOR",
    });
  });

  it("blocks createChurchDepartmentResource on a FREE church", async () => {
    const request = makeRequest({
      hasFeature: false,
      params: { id: "dept-1" },
      body: { title: "Cifra", url: "https://example.com" },
    });

    await expect(adapters.createChurchDepartmentResource(request)).rejects.toThrow(DomainError);
  });

  it("blocks sendChurchScheduleReminder on a FREE church", async () => {
    const request = makeRequest({ hasFeature: false, params: { id: "schedule-1" } });

    await expect(adapters.sendChurchScheduleReminder(request)).rejects.toThrow(DomainError);
  });

  it("blocks importCifraClubSong on a FREE church", async () => {
    const request = makeRequest({
      hasFeature: false,
      params: { id: "dept-1" },
      body: { url: "https://www.cifraclub.com.br/artista/musica" },
    });

    await expect(adapters.importCifraClubSong(request)).rejects.toThrow(DomainError);
  });

  it("blocks previewSongsFromPdf on a FREE church", async () => {
    const request = makeRequest({ hasFeature: false, params: { id: "dept-1" } });

    await expect(adapters.previewSongsFromPdf(request)).rejects.toThrow(DomainError);
  });

  it("blocks importSongsFromPdf on a FREE church", async () => {
    const request = makeRequest({ hasFeature: false, params: { id: "dept-1" }, body: { songs: [] } });

    await expect(adapters.importSongsFromPdf(request)).rejects.toThrow(DomainError);
  });

  it("blocks uploadChurchDepartmentPdf on a FREE church", async () => {
    const request = makeRequest({ hasFeature: false, params: { id: "dept-1" } });

    await expect(adapters.uploadChurchDepartmentPdf(request)).rejects.toThrow(DomainError);
  });
});
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `npx jest tests/churchDepartmentPlanGate.test.ts`
Expected: FAIL em todos os 6 — hoje nenhuma dessas chamadas é bloqueada por plano (vão falhar mais adiante por outro motivo, ou passar, mas não com `DomainError` de plano).

- [ ] **Step 4: Adicionar o gate nos seis métodos**

Em `api/src/interfaces/adapters/churchDepartmentAdapters.ts`:

`uploadChurchDepartmentPdf` (linha 658-666) passa de:
```ts
  async uploadChurchDepartmentPdf(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    await this.assertCanUploadDepartmentPdf(user, id);
```
para:
```ts
  async uploadChurchDepartmentPdf(request: FastifyRequest) {
    if (!request.churchContext?.hasFeature("MINISTRY_RESOURCES")) {
      throw new DomainError("Recursos do ministério estão disponíveis apenas no plano Pro");
    }
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    await this.assertCanUploadDepartmentPdf(user, id);
```

`sendChurchScheduleReminder` (linha 1631-1640) passa de:
```ts
  async sendChurchScheduleReminder(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Escala nao informada");
    }

    const schedule = await this.getScheduleFromCurrentChurch(id, user.crunchId!);
    await this.assertCanSendScheduleNotifications(user, schedule.departmentId);
```
para:
```ts
  async sendChurchScheduleReminder(request: FastifyRequest) {
    if (!request.churchContext?.hasFeature("SCHEDULE_REMINDER")) {
      throw new DomainError("Lembrete automático de escala está disponível apenas no plano Pro");
    }
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Escala nao informada");
    }

    const schedule = await this.getScheduleFromCurrentChurch(id, user.crunchId!);
    await this.assertCanSendScheduleNotifications(user, schedule.departmentId);
```

`importCifraClubSong` (linha 2255-2273) passa de:
```ts
  async importCifraClubSong(request: FastifyRequest): Promise<CifraClubSongImport> {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as {
      title?: string;
      artist?: string;
      url?: string;
    };

    if (!id) {
      throw new DomainError("Ministerio nao informado");
    }

    await this.assertDepartmentPermission(
```
para:
```ts
  async importCifraClubSong(request: FastifyRequest): Promise<CifraClubSongImport> {
    if (!request.churchContext?.hasFeature("CIFRA_CLUB_IMPORT")) {
      throw new DomainError("Importar música do Cifra Club está disponível apenas no plano Pro");
    }
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as {
      title?: string;
      artist?: string;
      url?: string;
    };

    if (!id) {
      throw new DomainError("Ministerio nao informado");
    }

    await this.assertDepartmentPermission(
```

`previewSongsFromPdf` (linha 2413-2419) passa de:
```ts
  async previewSongsFromPdf(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    await this.assertDepartmentPermission(
      user,
      id,
      "SONG_CREATE",
      "Apenas pastores, admins ou cargos com permissao podem importar musicas deste ministerio",
    );
```
para (nota: `importSongsFromPdf`, logo abaixo, tem o mesmo trecho `assertDepartmentPermission` com a mesma mensagem — usar contexto suficiente pra não ambiguar a substituição, ou editar cada bloco manualmente conferindo o número da linha):
```ts
  async previewSongsFromPdf(request: FastifyRequest) {
    if (!request.churchContext?.hasFeature("PDF_SONG_IMPORT")) {
      throw new DomainError("Importar músicas via PDF está disponível apenas no plano Pro");
    }
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    await this.assertDepartmentPermission(
      user,
      id,
      "SONG_CREATE",
      "Apenas pastores, admins ou cargos com permissao podem importar musicas deste ministerio",
    );
```

`importSongsFromPdf` (linha 2469-2482) passa de:
```ts
  async importSongsFromPdf(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    await this.assertDepartmentPermission(
      user,
      id,
      "SONG_CREATE",
      "Apenas pastores, admins ou cargos com permissao podem importar musicas deste ministerio",
    );

    const body = request.body as {
```
para:
```ts
  async importSongsFromPdf(request: FastifyRequest) {
    if (!request.churchContext?.hasFeature("PDF_SONG_IMPORT")) {
      throw new DomainError("Importar músicas via PDF está disponível apenas no plano Pro");
    }
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    await this.assertDepartmentPermission(
      user,
      id,
      "SONG_CREATE",
      "Apenas pastores, admins ou cargos com permissao podem importar musicas deste ministerio",
    );

    const body = request.body as {
```

`createChurchDepartmentResource` (linha 2819-2836) passa de:
```ts
  async createChurchDepartmentResource(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as {
      title?: string;
      url?: string;
      category?: string;
      notes?: string;
      pdfUrl?: string | null;
      pdfKey?: string | null;
      pdfFileName?: string | null;
      pdfMimeType?: string | null;
      pdfSize?: number | string | null;
    };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }
```
para:
```ts
  async createChurchDepartmentResource(request: FastifyRequest) {
    if (!request.churchContext?.hasFeature("MINISTRY_RESOURCES")) {
      throw new DomainError("Recursos do ministério estão disponíveis apenas no plano Pro");
    }
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as {
      title?: string;
      url?: string;
      category?: string;
      notes?: string;
      pdfUrl?: string | null;
      pdfKey?: string | null;
      pdfFileName?: string | null;
      pdfMimeType?: string | null;
      pdfSize?: number | string | null;
    };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `npx jest tests/churchDepartmentPlanGate.test.ts`
Expected: PASS, 6 testes.

- [ ] **Step 6: Rodar a suíte inteira pra checar regressão**

Run (da raiz): `npm run api:test`
Expected: PASS em tudo — em particular `departmentModules.test.ts`/`pdfSongExtraction.test.ts`, que podem exercitar métodos vizinhos deste mesmo arquivo.

- [ ] **Step 7: Commit**

```bash
git add api/src/interfaces/adapters/churchDepartmentAdapters.ts api/tests/churchDepartmentPlanGate.test.ts
git commit -m "feat: gate ministry PDF resources, schedule reminders and song import behind the Pro plan"
```

---

### Task 8: Gate de progresso de leitura do devocional (`DEVOTIONAL_PROGRESS`)

**Files:**
- Modify: `api/src/interfaces/adapters/devotionalAdapters.ts:246-251` (`updateProgress`)
- Test: `api/tests/devotionalPlanGate.test.ts` (novo arquivo)

- [ ] **Step 1: Escrever o teste (falhando)**

Criar `api/tests/devotionalPlanGate.test.ts`:

```ts
const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  devotionalChapter: { findFirst: jest.fn() },
  devotionalProgress: { upsert: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import { FastifyRequest } from "fastify";
import { DevotionalAdapters } from "../src/interfaces/adapters/devotionalAdapters";
import { DomainError } from "../src/domain/value-objects/utils/DomainError";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(hasFeature: boolean): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("member-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role: "MEMBRO",
      canManageMembers: false,
      roles: [],
      membershipId: "membership-1",
      hasFeature: () => hasFeature,
    },
    params: { id: "devotional-1" },
    body: { chapterId: "chapter-1" },
  } as unknown as FastifyRequest;
}

describe("DevotionalAdapters.updateProgress plan gate", () => {
  let adapters: DevotionalAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new DevotionalAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "member-1",
      crunchId: "church-1",
    });
  });

  it("blocks progress tracking on a FREE church", async () => {
    await expect(adapters.updateProgress(makeRequest(false))).rejects.toThrow(DomainError);
    expect(mockPrismaClient.devotionalChapter.findFirst).not.toHaveBeenCalled();
  });

  it("allows progress tracking on a PRO church", async () => {
    mockPrismaClient.devotionalChapter.findFirst.mockResolvedValue({ id: "chapter-1" });
    mockPrismaClient.devotionalProgress.upsert.mockResolvedValue({ id: "progress-1" });

    await adapters.updateProgress(makeRequest(true));

    expect(mockPrismaClient.devotionalProgress.upsert).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx jest tests/devotionalPlanGate.test.ts`
Expected: FAIL no primeiro teste.

- [ ] **Step 3: Adicionar o gate**

Em `api/src/interfaces/adapters/devotionalAdapters.ts`, `updateProgress` (linha 246-251) passa de:

```ts
  async updateProgress(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as { chapterId?: string };
    if (!id) throw new DomainError("Devocional não informado");
    if (!body.chapterId) throw new DomainError("Capítulo não informado");
```
para:
```ts
  async updateProgress(request: FastifyRequest) {
    if (!request.churchContext?.hasFeature("DEVOTIONAL_PROGRESS")) {
      throw new DomainError("Progresso de leitura do devocional está disponível apenas no plano Pro");
    }
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as { chapterId?: string };
    if (!id) throw new DomainError("Devocional não informado");
    if (!body.chapterId) throw new DomainError("Capítulo não informado");
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx jest tests/devotionalPlanGate.test.ts`
Expected: PASS, 2 testes.

- [ ] **Step 5: Commit**

```bash
git add api/src/interfaces/adapters/devotionalAdapters.ts api/tests/devotionalPlanGate.test.ts
git commit -m "feat: gate devotional reading progress behind the Pro plan"
```

---

### Task 9: Gate de relatórios (`REPORTS`)

`getCurrentUser` em `reportAdapters.ts` já é o único ponto de entrada compartilhado pelas 3 rotas de relatório (`getConfirmationReport`, `getAttendanceReport`, `getMembersReport`) — um gate ali cobre as três de uma vez.

**Files:**
- Modify: `api/src/interfaces/adapters/reportAdapters.ts:23-40` (`getCurrentUser`)
- Test: `api/tests/reportAdapters.test.ts` (novo arquivo)

- [ ] **Step 1: Escrever o teste (falhando)**

Criar `api/tests/reportAdapters.test.ts`:

```ts
const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  scheduleAssignment: { groupBy: jest.fn() },
  schedule: { findMany: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import { FastifyRequest } from "fastify";
import { ReportAdapters } from "../src/interfaces/adapters/reportAdapters";
import { DomainError } from "../src/domain/value-objects/utils/DomainError";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(hasFeature: boolean): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("pastor-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role: "PASTOR",
      canManageMembers: true,
      roles: [],
      membershipId: "membership-1",
      hasFeature: () => hasFeature,
    },
    params: {},
    query: {},
  } as unknown as FastifyRequest;
}

describe("ReportAdapters plan gate", () => {
  let adapters: ReportAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new ReportAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({ id: "pastor-1" });
  });

  it("blocks getConfirmationReport on a FREE church", async () => {
    await expect(adapters.getConfirmationReport(makeRequest(false))).rejects.toThrow(DomainError);
  });

  it("blocks getAttendanceReport on a FREE church", async () => {
    await expect(adapters.getAttendanceReport(makeRequest(false))).rejects.toThrow(DomainError);
  });

  it("blocks getMembersReport on a FREE church", async () => {
    await expect(adapters.getMembersReport(makeRequest(false))).rejects.toThrow(DomainError);
  });

  it("allows getConfirmationReport on a PRO church", async () => {
    mockPrismaClient.scheduleAssignment.groupBy.mockResolvedValue([]);
    mockPrismaClient.schedule.findMany.mockResolvedValue([]);

    const result = await adapters.getConfirmationReport(makeRequest(true));

    expect(result.items).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx jest tests/reportAdapters.test.ts`
Expected: FAIL nos 3 primeiros.

- [ ] **Step 3: Adicionar o gate em `getCurrentUser`**

Em `api/src/interfaces/adapters/reportAdapters.ts`, o método (linhas 23-40) passa de:

```ts
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
    return {
      ...user,
      crunchId: context.activeChurchId,
      role: context.role,
      canManageMembers: context.canManageMembers,
    };
  }
```
para:
```ts
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
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx jest tests/reportAdapters.test.ts`
Expected: PASS, 4 testes.

- [ ] **Step 5: Commit**

```bash
git add api/src/interfaces/adapters/reportAdapters.ts api/tests/reportAdapters.test.ts
git commit -m "feat: gate church reports behind the Pro plan"
```

---

### Task 10: Silenciar notificações em massa em igrejas FREE (`MASS_NOTIFICATIONS`)

Diferente das outras tasks: aqui a ação principal (criar/atualizar anúncio, aprovar oração) **continua funcionando** em qualquer plano — só o broadcast de push pra toda a igreja não dispara sem a feature. Não é `DomainError`, é pular a chamada.

**Files:**
- Modify: `api/src/interfaces/adapters/announcementAdapters.ts:100-107` (`createAnnouncement`) e `:163-170` (`updateAnnouncement`)
- Modify: `api/src/interfaces/adapters/prayerAdapters.ts:175-177` (`approvePrayerRequest`)
- Test: `api/tests/prayerAdapters.test.ts` (adicionar um `describe` novo — arquivo já existe, não recriar) e `api/tests/announcementAdapters.test.ts` (checar se existe antes; se não, criar)

- [ ] **Step 1: Checar se `announcementAdapters.test.ts` já existe**

Run: `ls api/tests/ | grep -i announcement`
Expected: nenhum resultado — criar `api/tests/announcementAdapters.test.ts` novo.

- [ ] **Step 2: Escrever os testes (falhando)**

Criar `api/tests/announcementAdapters.test.ts`:

```ts
const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  announcement: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
  crunch: { findUnique: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

const mockSendPublicChurchContent = jest.fn();

jest.mock("../src/infrastructure/notifications/PushNotificationService", () => ({
  pushNotificationService: {
    sendPublicChurchContent: (...args: unknown[]) => mockSendPublicChurchContent(...args),
  },
}));

import { FastifyRequest } from "fastify";
import { AnnouncementAdapters } from "../src/interfaces/adapters/announcementAdapters";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(hasFeature: boolean, body: Record<string, unknown>): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("pastor-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role: "PASTOR",
      canManageMembers: true,
      roles: [],
      membershipId: "membership-1",
      hasFeature: () => hasFeature,
    },
    params: {},
    body,
  } as unknown as FastifyRequest;
}

describe("AnnouncementAdapters mass notification gate", () => {
  let adapters: AnnouncementAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new AnnouncementAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "pastor-1",
      crunchId: "church-1",
      role: "PASTOR",
    });
    mockPrismaClient.announcement.create.mockResolvedValue({
      id: "ann-1",
      title: "Culto especial",
      body: "Venha participar",
      isPublic: true,
    });
    mockPrismaClient.crunch.findUnique.mockResolvedValue({ slug: "igreja-central" });
  });

  it("creates the announcement but skips the push on a FREE church", async () => {
    const result = await adapters.createAnnouncement(
      makeRequest(false, { title: "Culto especial", body: "Venha participar", isPublic: true }),
    );

    expect(result.id).toBe("ann-1");
    expect(mockPrismaClient.announcement.create).toHaveBeenCalled();
    expect(mockSendPublicChurchContent).not.toHaveBeenCalled();
  });

  it("creates the announcement and sends the push on a PRO church", async () => {
    await adapters.createAnnouncement(
      makeRequest(true, { title: "Culto especial", body: "Venha participar", isPublic: true }),
    );

    expect(mockSendPublicChurchContent).toHaveBeenCalled();
  });
});
```

Adicionar no fim de `api/tests/prayerAdapters.test.ts` (arquivo já existe — só o `describe` abaixo é novo):

```ts
describe("PrayerAdapters mass notification gate", () => {
  let adapters: PrayerAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new PrayerAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({ id: "user-1", name: "Pastor Teste" });
    mockPrismaClient.prayerRequest.updateMany.mockResolvedValue({ count: 1 });
    mockPrismaClient.prayerRequest.findUnique.mockResolvedValue({
      id: "prayer-1",
      title: "Pedido",
      body: "Texto do pedido",
    });
  });

  it("approves the prayer request but skips the broadcast on a FREE church", async () => {
    const request = makeRequest({
      churchContext: { ...pastorContext, hasFeature: () => false },
      params: { id: "prayer-1" },
    });

    await adapters.approvePrayerRequest(request);

    expect(mockPrismaClient.prayerRequest.updateMany).toHaveBeenCalled();
    expect(mockSendPublicChurchContent).not.toHaveBeenCalled();
  });

  it("approves the prayer request and broadcasts on a PRO church", async () => {
    const request = makeRequest({
      churchContext: { ...pastorContext, hasFeature: () => true },
      params: { id: "prayer-1" },
    });

    await adapters.approvePrayerRequest(request);

    expect(mockSendPublicChurchContent).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `npx jest tests/announcementAdapters.test.ts tests/prayerAdapters.test.ts`
Expected: FAIL nos testes "skips" (hoje o push sempre dispara, `hasFeature` ainda não é checado nesses pontos).

- [ ] **Step 4: Adicionar o gate silencioso nos três call sites**

Em `api/src/interfaces/adapters/announcementAdapters.ts`, `createAnnouncement` (linha 100-107) passa de:

```ts
    if (announcement.isPublic) {
      await pushNotificationService.sendPublicChurchContent(user.crunchId!, {
        title: announcement.title,
        body: announcement.body.slice(0, 160),
        url: `/c/${(await $prismaClient.crunch.findUnique({ where: { id: user.crunchId! }, select: { slug: true } }))?.slug}`,
        type: "public-announcement",
      });
    }
```
para:
```ts
    if (announcement.isPublic && request.churchContext?.hasFeature("MASS_NOTIFICATIONS")) {
      await pushNotificationService.sendPublicChurchContent(user.crunchId!, {
        title: announcement.title,
        body: announcement.body.slice(0, 160),
        url: `/c/${(await $prismaClient.crunch.findUnique({ where: { id: user.crunchId! }, select: { slug: true } }))?.slug}`,
        type: "public-announcement",
      });
    }
```

`updateAnnouncement` (linha 163-170) passa de:
```ts
    if (!announcement.isPublic && updated.isPublic) {
      const church = await $prismaClient.crunch.findUnique({ where: { id: user.crunchId! }, select: { slug: true } });
      await pushNotificationService.sendPublicChurchContent(user.crunchId!, {
        title: updated.title,
        body: updated.body.slice(0, 160),
        url: `/c/${church?.slug}`,
        type: "public-announcement",
```
para:
```ts
    if (!announcement.isPublic && updated.isPublic && request.churchContext?.hasFeature("MASS_NOTIFICATIONS")) {
      const church = await $prismaClient.crunch.findUnique({ where: { id: user.crunchId! }, select: { slug: true } });
      await pushNotificationService.sendPublicChurchContent(user.crunchId!, {
        title: updated.title,
        body: updated.body.slice(0, 160),
        url: `/c/${church?.slug}`,
        type: "public-announcement",
```

Em `api/src/interfaces/adapters/prayerAdapters.ts`, `approvePrayerRequest` (linha 175-177) passa de:

```ts
    if (prayer) {
      await this.notifyChurch(user.crunchId!, { title: prayer.title, body: prayer.body });
    }
```
para:
```ts
    if (prayer && request.churchContext?.hasFeature("MASS_NOTIFICATIONS")) {
      await this.notifyChurch(user.crunchId!, { title: prayer.title, body: prayer.body });
    }
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `npx jest tests/announcementAdapters.test.ts tests/prayerAdapters.test.ts`
Expected: PASS em todos.

- [ ] **Step 6: Rodar a suíte inteira**

Run (da raiz): `npm run api:test`
Expected: PASS em tudo — esse é o último task do plano.

- [ ] **Step 7: Commit**

```bash
git add api/src/interfaces/adapters/announcementAdapters.ts api/src/interfaces/adapters/prayerAdapters.ts api/tests/announcementAdapters.test.ts api/tests/prayerAdapters.test.ts
git commit -m "feat: silence mass-notification broadcast for churches without the Pro plan"
```

---

## Self-Review

**Cobertura do design doc:** as 9 features Premium/Pro implementadas hoje estão todas gateadas (Tasks 5-10); "Exportar escala como imagem" fica de fora por não existir backend ainda (documentado no topo do plano). Schema, `planConfig.ts`, resolução de plano efetivo, gate no `TenantHandler`/`churchContext`, aplicação nas rotas pagas e rota admin — todos os itens da "Divisão de trabalho" do design doc atribuídos a mim estão cobertos.

**Placeholders:** nenhum "TODO"/"implementar depois" — todo step tem código completo e testável.

**Consistência de tipos:** `PlanFeature` definido uma vez em `planConfig.ts` (Task 2) e consumido por nome exato (`"CUSTOM_ROLES"`, `"CUSTOM_PUBLIC_PAGE"`, `"MINISTRY_RESOURCES"`, `"SCHEDULE_REMINDER"`, `"CIFRA_CLUB_IMPORT"`, `"PDF_SONG_IMPORT"`, `"DEVOTIONAL_PROGRESS"`, `"MASS_NOTIFICATIONS"`, `"REPORTS"`) em todas as tasks seguintes — 9 valores usados, 9 valores declarados, nenhum sobrando nem faltando. `ActiveChurchContext.hasFeature` declarado uma vez (Task 3) e usado com a mesma assinatura em todo o resto.
