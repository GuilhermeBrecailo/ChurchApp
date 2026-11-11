const mockPrismaClient = {
  rosterMember: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  churchMembership: { findMany: jest.fn(), findFirst: jest.fn() },
  pastoralVisit: { findMany: jest.fn() },
  department: { findMany: jest.fn() },
  crunch: { findUnique: jest.fn() },
  serviceOccurrence: { findMany: jest.fn() },
  serviceOccurrenceAttendee: { findMany: jest.fn(), count: jest.fn(), findFirst: jest.fn() },
  userDepartmentMembership: { findMany: jest.fn() },
  scheduleAssignment: { findMany: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import { FastifyRequest } from "fastify";
import { PeopleAdapters } from "../src/interfaces/adapters/peopleAdapters";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(
  role: string,
  permissions: string[] = [],
  params: Record<string, string> = {},
): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("viewer-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role,
      canManageMembers: false,
      roles: permissions.length
        ? [{ id: "r1", name: "Cargo", scope: "CHURCH", departmentId: null, permissions }]
        : [],
    },
    params,
    query: {},
    body: {},
  } as unknown as FastifyRequest;
}

const rosterRows = [
  {
    id: "roster-ana",
    name: "Ana",
    email: "ana@test.com",
    phone: "11999990000",
    status: "MEMBER",
    joinedAt: new Date("2025-01-01"),
    leftAt: null,
    createdAt: new Date("2025-01-01"),
    userId: "user-ana",
    user: { avatarUrl: null },
    visitorFollowUp: null,
  },
  {
    id: "roster-bia",
    name: "Bia",
    email: null,
    phone: "11988887777",
    status: "VISITOR",
    joinedAt: null,
    leftAt: null,
    createdAt: new Date("2026-11-01"),
    userId: null,
    user: null,
    visitorFollowUp: {
      stage: "NEW",
      consentToContact: true,
      nextContactAt: new Date("2026-11-12"),
      lastContactAt: null,
      responsible: { id: "viewer-1", name: "Pastor" },
    },
  },
];

function mockList(options: { attendees?: { rosterMemberId: string }[] } = {}) {
  mockPrismaClient.rosterMember.findMany.mockResolvedValue(rosterRows);
  mockPrismaClient.churchMembership.findMany.mockImplementation(
    (args: { where: { isActive: boolean; user?: unknown } }) => {
      // syncMissingRosterMembers: nada faltando.
      if (args.where.user) return Promise.resolve([]);
      if (args.where.isActive === false) {
        return Promise.resolve([
          {
            id: "membership-pending",
            createdAt: new Date("2026-11-10"),
            user: { id: "user-caio", name: "Caio", email: "caio@test.com", phone: null, avatarUrl: null },
          },
        ]);
      }
      return Promise.resolve([
        {
          id: "membership-ana",
          userId: "user-ana",
          role: "MEMBER",
          user: { id: "user-ana", name: "Ana" },
          membershipRoles: [
            {
              churchRole: {
                id: "role-sec",
                name: "Secretária",
                scope: "CHURCH",
                departmentId: null,
                permissions: ["MEMBER_CREATE"],
              },
            },
          ],
        },
      ]);
    },
  );
  mockPrismaClient.pastoralVisit.findMany.mockResolvedValue([
    { rosterMemberId: "roster-ana", scheduledAt: new Date("2026-11-20T15:00:00Z") },
  ]);
  mockPrismaClient.department.findMany.mockResolvedValue([
    { id: "dep-1", name: "Louvor", leaderId: "someone", members: [{ userId: "user-ana" }] },
  ]);
  mockPrismaClient.crunch.findUnique.mockResolvedValue({ userMainId: "pastor-1" });
  mockPrismaClient.serviceOccurrence.findMany.mockResolvedValue([{ id: "occ-1" }, { id: "occ-2" }]);
  mockPrismaClient.serviceOccurrenceAttendee.findMany.mockResolvedValue(options.attendees ?? []);
}

describe("PeopleAdapters.list", () => {
  let adapters: PeopleAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new PeopleAdapters();
  });

  it("rejects a member without people or pastoral care permission", async () => {
    await expect(adapters.list(makeRequest("MEMBER"))).rejects.toThrow(
      "Sem permissão para ver as pessoas da igreja",
    );
    expect(mockPrismaClient.rosterMember.findMany).not.toHaveBeenCalled();
  });

  it("gives the pastor accounts, roles, ministries, pending requests and care flags", async () => {
    mockList({ attendees: [{ rosterMemberId: "someone-else" }] });

    const result = await adapters.list(makeRequest("PASTOR"));

    expect(mockPrismaClient.rosterMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { crunchId: "church-1" } }),
    );
    const ana = result.people.find((person) => person.id === "roster-ana")!;
    expect(ana).toMatchObject({
      hasAccount: true,
      membershipId: "membership-ana",
      role: "MEMBER",
      departments: ["Louvor"],
      care: { openVisits: 1, nextVisitAt: "2026-11-20T15:00:00.000Z", absent: true },
    });
    expect(ana.roles.map((role) => role.name)).toEqual(["Secretária"]);
    const bia = result.people.find((person) => person.id === "roster-bia")!;
    expect(bia).toMatchObject({
      hasAccount: false,
      followUp: { stage: "NEW", consentToContact: true, nextContactAt: "2026-11-12T00:00:00.000Z" },
    });
    expect(result.pending).toEqual([
      expect.objectContaining({ membershipId: "membership-pending", name: "Caio" }),
    ]);
    expect(result.access).toMatchObject({ canCreate: true, canCare: true, canSeeAccounts: true });
  });

  it("does not mark anyone absent when the church does not take attendance by name", async () => {
    mockList({ attendees: [] });

    const result = await adapters.list(makeRequest("PASTOR"));

    expect(result.people.every((person) => person.care?.absent === false)).toBe(true);
  });

  it("lets a pastoral care role read people without account data, pending or former members", async () => {
    mockList();

    const result = await adapters.list(makeRequest("MEMBER", ["PASTORAL_CARE_MANAGE"]));

    expect(mockPrismaClient.rosterMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { crunchId: "church-1", status: { not: "FORMER" } } }),
    );
    const ana = result.people.find((person) => person.id === "roster-ana")!;
    expect(ana).toMatchObject({ hasAccount: true, membershipId: null, role: null, roles: [], userId: null });
    expect(ana.care).not.toBeNull();
    expect(result.pending).toEqual([]);
    expect(result.responsibles).toEqual([{ id: "user-ana", name: "Ana" }]);
    expect(result.access).toMatchObject({ canCreate: false, canSeeAccounts: false, canCare: true });
  });

  it("lets a secretary (MEMBER_CREATE) see accounts but no care flags", async () => {
    mockList();

    const result = await adapters.list(makeRequest("MEMBER", ["MEMBER_CREATE"]));

    expect(result.people[0].care).toBeNull();
    expect(result.people[0].membershipId).toBe("membership-ana");
    expect(mockPrismaClient.pastoralVisit.findMany).not.toHaveBeenCalled();
    expect(result.responsibles).toEqual([]);
  });
});

describe("PeopleAdapters.get", () => {
  let adapters: PeopleAdapters;

  const baseRow = {
    id: "roster-ana",
    name: "Ana",
    email: "ana@test.com",
    phone: "11999990000",
    birthDate: null,
    notes: "Gosta de servir",
    status: "MEMBER",
    joinedAt: new Date("2025-01-01"),
    leftAt: null,
    createdAt: new Date("2025-01-01"),
    userId: "user-ana",
    user: { avatarUrl: null, mustChangePassword: false },
    visitorFollowUp: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new PeopleAdapters();
    mockPrismaClient.crunch.findUnique.mockResolvedValue({ userMainId: "pastor-1" });
    mockPrismaClient.userDepartmentMembership.findMany.mockResolvedValue([
      { function: "Teclado", department: { id: "dep-1", name: "Louvor" } },
    ]);
    mockPrismaClient.department.findMany.mockResolvedValue([{ id: "dep-2", name: "Mídia" }]);
    mockPrismaClient.scheduleAssignment.findMany.mockResolvedValue([
      {
        id: "assign-1",
        role: "Teclado",
        confirmationStatus: "CONFIRMED",
        schedule: {
          id: "schedule-1",
          date: new Date("2026-11-15T00:00:00Z"),
          description: "Culto de domingo",
          department: { id: "dep-1", name: "Louvor" },
        },
      },
    ]);
    mockPrismaClient.pastoralVisit.findMany.mockResolvedValue([]);
    mockPrismaClient.churchMembership.findMany.mockResolvedValue([]);
    mockPrismaClient.serviceOccurrence.findMany.mockResolvedValue([]);
    mockPrismaClient.serviceOccurrenceAttendee.findFirst.mockResolvedValue(null);
  });

  it("returns ministries, next assignments and manager permissions for a regular member", async () => {
    mockPrismaClient.rosterMember.findFirst.mockResolvedValue(baseRow);
    mockPrismaClient.churchMembership.findFirst.mockResolvedValue({
      id: "membership-ana",
      role: "MEMBER",
      membershipRoles: [],
    });

    const result = await adapters.get(makeRequest("PASTOR", [], { rosterId: "roster-ana" }));

    expect(mockPrismaClient.rosterMember.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "roster-ana", crunchId: "church-1" } }),
    );
    expect(result.ministries).toEqual([
      { id: "dep-1", name: "Louvor", function: "Teclado", isLeader: false },
      { id: "dep-2", name: "Mídia", function: null, isLeader: true },
    ]);
    expect(result.upcomingAssignments[0]).toMatchObject({ scheduleId: "schedule-1", role: "Teclado" });
    expect(result.permissions).toMatchObject({
      canEditAccount: true,
      canManageRoles: true,
      canResetPassword: true,
      canInvite: false,
      canRemoveFromChurch: true,
    });
  });

  it("never offers to edit the type or reset the password of an ADMIN", async () => {
    mockPrismaClient.rosterMember.findFirst.mockResolvedValue(baseRow);
    mockPrismaClient.churchMembership.findFirst.mockResolvedValue({
      id: "membership-ana",
      role: "ADMIN",
      membershipRoles: [],
    });

    const result = await adapters.get(makeRequest("PASTOR", [], { rosterId: "roster-ana" }));

    expect(result.person.role).toBe("ADMIN");
    expect(result.permissions.canEditAccount).toBe(false);
    expect(result.permissions.canResetPassword).toBe(false);
  });

  it("offers the invite for someone without an account", async () => {
    mockPrismaClient.rosterMember.findFirst.mockResolvedValue({ ...baseRow, userId: null, user: null });

    const result = await adapters.get(makeRequest("MEMBER", ["MEMBER_CREATE"], { rosterId: "roster-ana" }));

    expect(result.person.hasAccount).toBe(false);
    expect(result.permissions.canInvite).toBe(true);
    expect(result.permissions.canResetPassword).toBe(false);
    expect(result.visits).toEqual([]);
    expect(mockPrismaClient.pastoralVisit.findMany).not.toHaveBeenCalled();
  });

  it("hides former members from a pastoral-care-only viewer", async () => {
    mockPrismaClient.rosterMember.findFirst.mockResolvedValue({ ...baseRow, status: "FORMER" });

    await expect(
      adapters.get(makeRequest("MEMBER", ["PASTORAL_CARE_MANAGE"], { rosterId: "roster-ana" })),
    ).rejects.toThrow("Pessoa não encontrada");
  });

  it("does not leak another church's person", async () => {
    mockPrismaClient.rosterMember.findFirst.mockResolvedValue(null);

    await expect(adapters.get(makeRequest("PASTOR", [], { rosterId: "other" }))).rejects.toThrow(
      "Pessoa não encontrada",
    );
  });
});
