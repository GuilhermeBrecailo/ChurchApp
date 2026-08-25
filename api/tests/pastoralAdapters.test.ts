import { FastifyRequest } from "fastify";

const mockPrismaClient = {
  churchMembership: { findFirst: jest.fn() },
  serviceOccurrence: { findMany: jest.fn() },
  serviceOccurrenceAttendee: { findMany: jest.fn() },
  rosterMember: { findMany: jest.fn(), findUnique: jest.fn() },
  prayerRequest: { findMany: jest.fn(), count: jest.fn() },
  pastoralVisit: {
    count: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import { PastoralAdapters } from "../src/interfaces/adapters/pastoralAdapters";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(
  role: string,
  overrides: {
    roles?: { scope: string; departmentId: string | null; permissions: string[] }[];
    params?: Record<string, unknown>;
    query?: Record<string, unknown>;
    body?: Record<string, unknown>;
  } = {},
): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("user-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role,
      roles: overrides.roles ?? [],
      canManageMembers: role === "PASTOR",
      hasFeature: () => true,
    },
    params: overrides.params ?? {},
    query: overrides.query ?? {},
    body: overrides.body ?? {},
  } as unknown as FastifyRequest;
}

const baseOccurrence = {
  id: "occ-1",
  date: new Date("2026-08-23T00:00:00.000Z"),
  title: null,
  time: null,
  imageUrl: null,
  serviceTime: { label: "Culto da Família", time: "19:00", weekday: 0 },
  _count: { schedules: 2, attendees: 38 },
  attendanceRecords: [{ visitorCount: 4, memberCount: 38 }],
};

describe("PastoralAdapters", () => {
  let adapters: PastoralAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new PastoralAdapters();
    jest.useFakeTimers().setSystemTime(new Date("2026-08-25T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("blocks members without the pastoral care permission", async () => {
    await expect(adapters.getDashboard(makeRequest("MEMBRO"))).rejects.toThrow(
      "Sem permissão para cuidado pastoral",
    );

    expect(mockPrismaClient.serviceOccurrence.findMany).not.toHaveBeenCalled();
  });

  it("builds the pastoral dashboard from cults, prayers, visits and absent members", async () => {
    mockPrismaClient.serviceOccurrence.findMany
      .mockResolvedValueOnce([{ ...baseOccurrence, id: "upcoming-1", date: new Date("2026-08-26") }])
      .mockResolvedValueOnce([
        { ...baseOccurrence, id: "occ-1", date: new Date("2026-08-24") },
        { ...baseOccurrence, id: "occ-2", date: new Date("2026-08-17") },
      ]);
    mockPrismaClient.rosterMember.findMany.mockResolvedValue([
      { id: "member-1", name: "Ana", phone: "11999990000", email: null },
      { id: "member-2", name: "Bruno", phone: null, email: "bruno@test.com" },
    ]);
    mockPrismaClient.serviceOccurrenceAttendee.findMany.mockResolvedValue([
      {
        rosterMemberId: "member-2",
        serviceOccurrence: { id: "occ-2", date: new Date("2026-08-17") },
      },
    ]);
    mockPrismaClient.prayerRequest.findMany.mockResolvedValue([
      { id: "prayer-1", title: "Cura", createdAt: new Date("2026-08-24"), user: { name: "Maria" } },
    ]);
    mockPrismaClient.prayerRequest.count.mockResolvedValue(1);
    mockPrismaClient.pastoralVisit.count.mockResolvedValue(2);
    mockPrismaClient.pastoralVisit.findMany.mockResolvedValue([
      {
        id: "visit-1",
        reason: "Acompanhamento",
        priority: "HIGH",
        status: "SCHEDULED",
        scheduledAt: new Date("2026-08-27T18:00:00.000Z"),
        completedAt: null,
        notes: null,
        rosterMember: { id: "member-1", name: "Ana", status: "MEMBER", phone: "11999990000" },
        responsible: { id: "user-1", name: "Pastor" },
      },
    ]);

    const dashboard = await adapters.getDashboard(makeRequest("PASTOR"));

    expect(dashboard.stats).toEqual({
      upcomingCults: 1,
      pendingPrayers: 1,
      absentMembers: 1,
      openVisits: 2,
    });
    expect(dashboard.absentMembers).toEqual([
      {
        id: "member-1",
        name: "Ana",
        phone: "11999990000",
        email: null,
        missedOccurrences: 2,
        lastPresentAt: null,
      },
    ]);
    expect(dashboard.recentCultSummaries[0]).toMatchObject({
      id: "occ-1",
      label: "Culto da Família",
      visitorCount: 4,
      memberCount: 38,
    });
  });

  it("allows a church role with PASTORAL_CARE_MANAGE to create a visit", async () => {
    mockPrismaClient.rosterMember.findUnique.mockResolvedValue({
      id: "member-1",
      crunchId: "church-1",
    });
    mockPrismaClient.churchMembership.findFirst.mockResolvedValue({ id: "membership-1" });
    mockPrismaClient.pastoralVisit.create.mockResolvedValue({
      id: "visit-1",
      reason: "Visita de cuidado",
      priority: "MEDIUM",
      status: "SCHEDULED",
    });

    await adapters.createVisit(
      makeRequest("MEMBRO", {
        roles: [{ scope: "CHURCH", departmentId: null, permissions: ["PASTORAL_CARE_MANAGE"] }],
        body: {
          rosterMemberId: "member-1",
          responsibleId: "user-2",
          reason: "Visita de cuidado",
          priority: "MEDIUM",
          scheduledAt: "2026-08-30T18:00:00.000Z",
        },
      }),
    );

    expect(mockPrismaClient.pastoralVisit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          crunchId: "church-1",
          rosterMemberId: "member-1",
          responsibleId: "user-2",
          reason: "Visita de cuidado",
          priority: "MEDIUM",
          status: "SCHEDULED",
          scheduledAt: new Date("2026-08-30T18:00:00.000Z"),
        }),
      }),
    );
  });

  it("marks a visit as completed with completedAt when status changes to DONE", async () => {
    mockPrismaClient.pastoralVisit.findFirst.mockResolvedValue({ id: "visit-1", crunchId: "church-1" });
    mockPrismaClient.pastoralVisit.update.mockResolvedValue({ id: "visit-1", status: "DONE" });

    await adapters.updateVisit(
      makeRequest("PASTOR", {
        params: { id: "visit-1" },
        body: { status: "DONE" },
      }),
    );

    expect(mockPrismaClient.pastoralVisit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "visit-1" },
        data: expect.objectContaining({
          status: "DONE",
          completedAt: new Date("2026-08-25T12:00:00.000Z"),
        }),
      }),
    );
  });

  it("deletes visits only inside the caller church", async () => {
    mockPrismaClient.pastoralVisit.deleteMany.mockResolvedValue({ count: 1 });

    await expect(
      adapters.deleteVisit(makeRequest("PASTOR", { params: { id: "visit-1" } })),
    ).resolves.toEqual({ success: true });

    expect(mockPrismaClient.pastoralVisit.deleteMany).toHaveBeenCalledWith({
      where: { id: "visit-1", crunchId: "church-1" },
    });
  });
});
