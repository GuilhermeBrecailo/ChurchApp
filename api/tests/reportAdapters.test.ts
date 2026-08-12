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
