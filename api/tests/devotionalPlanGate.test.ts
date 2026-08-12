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
