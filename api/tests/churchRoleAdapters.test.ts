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
