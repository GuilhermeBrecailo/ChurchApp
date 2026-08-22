const mockPrismaClient = {
  serviceTime: { findUnique: jest.fn() },
  serviceAttendance: { upsert: jest.fn(), findMany: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import { FastifyRequest } from "fastify";
import { AttendanceAdapters } from "../src/interfaces/adapters/attendanceAdapters";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(
  role: string,
  overrides: {
    query?: Record<string, string>;
    body?: Record<string, unknown>;
    params?: Record<string, string>;
  } = {},
): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("user-1")}` },
    churchContext: { activeChurchId: "church-1", role, roles: [] },
    query: overrides.query ?? {},
    body: overrides.body ?? {},
    params: overrides.params ?? {},
  } as unknown as FastifyRequest;
}

const VALID_BODY = {
  serviceTimeId: "st1",
  date: "2026-08-16",
  visitorCount: 5,
  memberCount: 40,
  notes: "Culto cheio",
};

describe("AttendanceAdapters - privilege gate", () => {
  let adapters: AttendanceAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new AttendanceAdapters();
  });

  const cases: [string, () => Promise<unknown>][] = [
    ["upsert", () => adapters.upsert(makeRequest("MEMBRO", { body: VALID_BODY }))],
    ["list", () => adapters.list(makeRequest("MEMBRO"))],
  ];

  it.each(cases)("%s rejects a non-privileged MEMBRO", async (_name, call) => {
    await expect(call()).rejects.toThrow("Apenas pastores ou administradores podem registrar presença");
    expect(mockPrismaClient.serviceAttendance.upsert).not.toHaveBeenCalled();
    expect(mockPrismaClient.serviceAttendance.findMany).not.toHaveBeenCalled();
  });
});

describe("AttendanceAdapters - upsert", () => {
  let adapters: AttendanceAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new AttendanceAdapters();
  });

  it("rejects a service time from another church", async () => {
    mockPrismaClient.serviceTime.findUnique.mockResolvedValue({ id: "st1", crunchId: "church-OTHER" });

    await expect(
      adapters.upsert(makeRequest("PASTOR", { body: VALID_BODY })),
    ).rejects.toThrow("Culto não encontrado");
    expect(mockPrismaClient.serviceAttendance.upsert).not.toHaveBeenCalled();
  });

  it("rejects a negative count", async () => {
    mockPrismaClient.serviceTime.findUnique.mockResolvedValue({ id: "st1", crunchId: "church-1" });

    await expect(
      adapters.upsert(makeRequest("PASTOR", { body: { ...VALID_BODY, visitorCount: -1 } })),
    ).rejects.toThrow();
  });

  it("upserts by serviceTimeId + date, so relaunching the same culto/day edits instead of duplicating", async () => {
    mockPrismaClient.serviceTime.findUnique.mockResolvedValue({ id: "st1", crunchId: "church-1" });
    mockPrismaClient.serviceAttendance.upsert.mockResolvedValue({ id: "a1" });

    await adapters.upsert(makeRequest("PASTOR", { body: VALID_BODY }));

    expect(mockPrismaClient.serviceAttendance.upsert).toHaveBeenCalledWith({
      where: {
        serviceTimeId_date: { serviceTimeId: "st1", date: new Date("2026-08-16") },
      },
      create: {
        crunchId: "church-1",
        serviceTimeId: "st1",
        date: new Date("2026-08-16"),
        visitorCount: 5,
        memberCount: 40,
        notes: "Culto cheio",
      },
      update: {
        visitorCount: 5,
        memberCount: 40,
        notes: "Culto cheio",
      },
    });
  });

  it("stores an empty notes as null", async () => {
    mockPrismaClient.serviceTime.findUnique.mockResolvedValue({ id: "st1", crunchId: "church-1" });
    mockPrismaClient.serviceAttendance.upsert.mockResolvedValue({ id: "a1" });

    await adapters.upsert(makeRequest("PASTOR", { body: { ...VALID_BODY, notes: "" } }));

    const call = mockPrismaClient.serviceAttendance.upsert.mock.calls[0][0];
    expect(call.create.notes).toBeNull();
    expect(call.update.notes).toBeNull();
  });
});

// 11.4 "Finalizar culto": primeiro toque cria o registro com endedAt, segundo
// toque no mesmo dia sobrescreve, campos de contagem intocados.
describe("AttendanceAdapters - finalize", () => {
  let adapters: AttendanceAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new AttendanceAdapters();
    jest.useFakeTimers().setSystemTime(new Date("2026-08-16T10:20:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("rejects a service time from another church", async () => {
    mockPrismaClient.serviceTime.findUnique.mockResolvedValue({ id: "st1", crunchId: "church-OTHER" });

    await expect(
      adapters.finalize(makeRequest("PASTOR", { params: { serviceTimeId: "st1" } })),
    ).rejects.toThrow("Culto não encontrado");
    expect(mockPrismaClient.serviceAttendance.upsert).not.toHaveBeenCalled();
  });

  it("rejects a non-privileged MEMBRO", async () => {
    await expect(
      adapters.finalize(makeRequest("MEMBRO", { params: { serviceTimeId: "st1" } })),
    ).rejects.toThrow("Apenas pastores ou administradores podem registrar presença");
    expect(mockPrismaClient.serviceAttendance.upsert).not.toHaveBeenCalled();
  });

  it("creates today's row with endedAt set on the first tap, headcount defaulted to zero", async () => {
    mockPrismaClient.serviceTime.findUnique.mockResolvedValue({ id: "st1", crunchId: "church-1" });
    mockPrismaClient.serviceAttendance.upsert.mockResolvedValue({ id: "a1" });

    await adapters.finalize(makeRequest("PASTOR", { params: { serviceTimeId: "st1" } }));

    expect(mockPrismaClient.serviceAttendance.upsert).toHaveBeenCalledWith({
      where: { serviceTimeId_date: { serviceTimeId: "st1", date: new Date("2026-08-16") } },
      create: {
        crunchId: "church-1",
        serviceTimeId: "st1",
        date: new Date("2026-08-16"),
        visitorCount: 0,
        memberCount: 0,
        endedAt: new Date("2026-08-16T10:20:00"),
      },
      update: { endedAt: new Date("2026-08-16T10:20:00") },
    });
  });

  it("overwrites endedAt with the later timestamp on a second same-day tap, without touching headcount fields", async () => {
    mockPrismaClient.serviceTime.findUnique.mockResolvedValue({ id: "st1", crunchId: "church-1" });
    mockPrismaClient.serviceAttendance.upsert.mockResolvedValue({ id: "a1" });

    await adapters.finalize(makeRequest("PASTOR", { params: { serviceTimeId: "st1" } }));
    jest.setSystemTime(new Date("2026-08-16T10:25:00"));
    await adapters.finalize(makeRequest("PASTOR", { params: { serviceTimeId: "st1" } }));

    const secondCall = mockPrismaClient.serviceAttendance.upsert.mock.calls[1][0];
    expect(secondCall.update).toEqual({ endedAt: new Date("2026-08-16T10:25:00") });
    expect(Object.keys(secondCall.update)).not.toEqual(
      expect.arrayContaining(["visitorCount", "memberCount"]),
    );
  });
});

describe("AttendanceAdapters - list", () => {
  let adapters: AttendanceAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new AttendanceAdapters();
  });

  it("defaults to 30 days and scopes to the caller's church", async () => {
    mockPrismaClient.serviceAttendance.findMany.mockResolvedValue([]);

    await adapters.list(makeRequest("PASTOR"));

    const call = mockPrismaClient.serviceAttendance.findMany.mock.calls[0][0];
    expect(call.where.crunchId).toBe("church-1");
    expect(call.orderBy).toEqual({ date: "desc" });
    expect(call.include).toEqual({ serviceTime: { select: { id: true, label: true, weekday: true, time: true } } });
  });
});
