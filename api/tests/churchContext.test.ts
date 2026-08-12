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
