const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  crunch: { findUnique: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import { FastifyRequest } from "fastify";
import { resolveActiveChurchContext } from "../src/interfaces/utils/churchContext";

function makeRequest(headers: Record<string, string> = {}): FastifyRequest {
  return { headers } as unknown as FastifyRequest;
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

  it("falls back to the first membership when x-church-id is stale/not one of the user's churches", async () => {
    // Regressao: cookie active_church_id de uma conta anterior no mesmo
    // navegador (ou igreja da qual o usuario foi removido) nao pode
    // derrubar a sessao com 403 - so cai no fallback normal.
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

    const context = await resolveActiveChurchContext(
      makeRequest({ "x-church-id": "church-from-a-different-account" }),
      "user-1",
    );

    expect(context.activeChurchId).toBe("church-1");
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

describe("resolveActiveChurchContext - multi-church membership", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient.crunch.findUnique.mockResolvedValue({
      plan: "FREE",
      subscriptionStatus: "TRIALING",
      trialEndsAt: null,
    });
  });

  // 7.1 Usuario com uma unica igreja: compatibilidade mantida (nenhum
  // x-church-id enviado, uma unica membership, resolve direto pra ela).
  it("resolves the single membership for a single-church user with no x-church-id sent", async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      crunchId: null,
      role: "MEMBRO",
      canManageMembers: false,
      churchMemberships: [
        {
          id: "membership-1",
          crunchId: "church-1",
          role: "MEMBRO",
          canManageMembers: false,
          membershipRoles: [],
        },
      ],
    });

    const context = await resolveActiveChurchContext(makeRequest(), "user-1");

    expect(context.activeChurchId).toBe("church-1");
    expect(context.membershipId).toBe("membership-1");
    expect(context.role).toBe("MEMBRO");
  });

  // 7.2 Usuario com duas igrejas alternando contexto: o x-church-id enviado
  // pela segunda igreja precisa trocar o contexto ativo pra ela, nao ficar
  // preso na primeira/primaria.
  it("switches active context to the second church when x-church-id targets it", async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      crunchId: null,
      role: "PASTOR",
      canManageMembers: true,
      churchMemberships: [
        {
          id: "membership-1",
          crunchId: "church-1",
          role: "PASTOR",
          canManageMembers: true,
          membershipRoles: [],
        },
        {
          id: "membership-2",
          crunchId: "church-2",
          role: "MEMBRO",
          canManageMembers: false,
          membershipRoles: [],
        },
      ],
    });

    const contextForChurch1 = await resolveActiveChurchContext(makeRequest(), "user-1");
    expect(contextForChurch1.activeChurchId).toBe("church-1");

    const contextForChurch2 = await resolveActiveChurchContext(
      makeRequest({ "x-church-id": "church-2" }),
      "user-1",
    );
    expect(contextForChurch2.activeChurchId).toBe("church-2");
    expect(contextForChurch2.membershipId).toBe("membership-2");
  });

  // 7.3 Isolamento entre tenants: um x-church-id de uma igreja que o usuario
  // NAO tem membership nunca pode virar a igreja ativa - precisa cair no
  // fallback (primeira membership do proprio usuario), nunca na igreja alheia.
  it("never activates a church the caller has no membership in, even when explicitly requested", async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      crunchId: null,
      role: "MEMBRO",
      canManageMembers: false,
      churchMemberships: [
        {
          id: "membership-1",
          crunchId: "church-1",
          role: "MEMBRO",
          canManageMembers: false,
          membershipRoles: [],
        },
      ],
    });

    const context = await resolveActiveChurchContext(
      makeRequest({ "x-church-id": "church-belonging-to-someone-else" }),
      "user-1",
    );

    expect(context.activeChurchId).not.toBe("church-belonging-to-someone-else");
    expect(context.activeChurchId).toBe("church-1");
  });

  // 7.4 Roles diferentes por igreja: mesmo usuario, PASTOR numa igreja e
  // MEMBRO na outra - o role resolvido tem que ser o da igreja ativa, nunca
  // vazar o role de uma igreja para o contexto da outra.
  it("resolves a different role per church for the same user", async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      crunchId: null,
      role: "PASTOR",
      canManageMembers: true,
      churchMemberships: [
        {
          id: "membership-1",
          crunchId: "church-1",
          role: "PASTOR",
          canManageMembers: true,
          membershipRoles: [
            {
              churchRole: {
                id: "role-1",
                name: "Pastor titular",
                scope: "CHURCH",
                departmentId: null,
                permissions: ["*"],
              },
            },
          ],
        },
        {
          id: "membership-2",
          crunchId: "church-2",
          role: "MEMBRO",
          canManageMembers: false,
          membershipRoles: [],
        },
      ],
    });

    const asPastor = await resolveActiveChurchContext(
      makeRequest({ "x-church-id": "church-1" }),
      "user-1",
    );
    expect(asPastor.role).toBe("PASTOR");
    expect(asPastor.roles).toHaveLength(1);
    expect(asPastor.roles[0].name).toBe("Pastor titular");

    const asMembro = await resolveActiveChurchContext(
      makeRequest({ "x-church-id": "church-2" }),
      "user-1",
    );
    expect(asMembro.role).toBe("MEMBRO");
    expect(asMembro.canManageMembers).toBe(false);
    expect(asMembro.roles).toHaveLength(0);
  });
});
