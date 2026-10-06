const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  crunch: { findUnique: jest.fn() },
  department: { findFirst: jest.fn() },
  userDepartmentMembership: { findUnique: jest.fn() },
  rosterMember: { findFirst: jest.fn(), create: jest.fn() },
  ministryChildProfile: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  ministryChildGuardian: { createMany: jest.fn(), deleteMany: jest.fn() },
  ministryChildSession: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
  ministryChildAttendance: { createMany: jest.fn(), upsert: jest.fn() },
  $transaction: jest.fn(),
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
  userId?: string;
  role?: string;
  roles?: { scope: string; departmentId: string | null; permissions: string[] }[];
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken(options.userId ?? "user-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role: options.role ?? "MEMBRO",
      canManageMembers: false,
      roles: options.roles ?? [],
      membershipId: "membership-1",
      hasFeature: () => true,
    },
    params: options.params ?? {},
    body: options.body ?? {},
    query: {},
  } as unknown as FastifyRequest;
}

const departmentRow = {
  id: "kids-1",
  name: "Ministério Infantil",
  type: "KIDS",
  isActive: true,
  modules: ["CLASSES"],
  leaderId: "leader-1",
  leader: { id: "leader-1", name: "Líder", email: "lider@igreja.com" },
  _count: { members: 2, schedules: 0, tasks: 0 },
  mediaItems: [],
};

describe("ChurchDepartmentAdapters - Ministério Infantil", () => {
  let adapters: ChurchDepartmentAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new ChurchDepartmentAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      crunchId: "church-1",
      role: "MEMBRO",
    });
    mockPrismaClient.crunch.findUnique.mockResolvedValue({ id: "church-1" });
    mockPrismaClient.department.findFirst.mockResolvedValue(departmentRow);
    mockPrismaClient.userDepartmentMembership.findUnique.mockResolvedValue(null);
  });

  it("permite à equipe vinculada listar crianças e responsáveis", async () => {
    mockPrismaClient.userDepartmentMembership.findUnique.mockResolvedValue({
      id: "team-membership",
    });
    const profiles = [
      {
        id: "child-profile-1",
        groupName: "Pequenos",
        isActive: true,
        rosterMember: { id: "child-1", name: "Ana", birthDate: null },
        guardians: [
          {
            guardianRosterMember: {
              id: "guardian-1",
              name: "Maria",
              phone: "11999990000",
            },
          },
        ],
      },
    ];
    mockPrismaClient.ministryChildProfile.findMany.mockResolvedValue(profiles);

    const result = await adapters.getMinistryChildren(
      makeRequest({ params: { id: "kids-1" } }),
    );

    expect(result).toEqual(profiles);
    expect(mockPrismaClient.ministryChildProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { departmentId: "kids-1", isActive: true } }),
    );
  });

  it("nega leitura de crianças a quem não pertence ao ministério", async () => {
    await expect(
      adapters.getMinistryChildren(makeRequest({ params: { id: "kids-1" } })),
    ).rejects.toThrow(DomainError);
    expect(mockPrismaClient.ministryChildProfile.findMany).not.toHaveBeenCalled();
  });

  it("permite leitura a um cargo com gestão do ministério mesmo sem membership duplicada", async () => {
    const profiles = [{ id: "profile-1" }];
    mockPrismaClient.ministryChildProfile.findMany.mockResolvedValue(profiles);

    const result = await adapters.getMinistryChildren(
      makeRequest({
        params: { id: "kids-1" },
        roles: [{ scope: "MINISTRY", departmentId: "kids-1", permissions: ["MINISTRY_MANAGE"] }],
      }),
    );

    expect(result).toEqual(profiles);
    expect(mockPrismaClient.userDepartmentMembership.findUnique).not.toHaveBeenCalled();
  });

  it("expõe o vínculo do usuário no detalhe do ministério para controlar a aba", async () => {
    mockPrismaClient.userDepartmentMembership.findUnique.mockResolvedValue({ id: "team" });

    const result = await adapters.getChurchDepartmentById(
      makeRequest({ params: { id: "kids-1" } }),
    );

    expect(result.isMember).toBe(true);
  });

  it("permite que a liderança cadastre criança com mais de um responsável existente", async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "leader-1",
      crunchId: "church-1",
      role: "MEMBRO",
    });
    const child = {
      id: "child-1",
      name: "Ana",
      email: null,
      phone: null,
      birthDate: new Date("2020-01-01T00:00:00.000Z"),
      crunchId: "church-1",
    };
    const profile = { id: "profile-1", departmentId: "kids-1", rosterMemberId: child.id };
    const tx = {
      rosterMember: {
        findFirst: jest.fn(async ({ where }: { where: { id?: string } }) => ({
          id: where.id ?? "guardian-1",
          crunchId: "church-1",
        })),
        create: jest.fn().mockResolvedValue(child),
      },
      ministryChildProfile: {
        create: jest.fn().mockResolvedValue(profile),
        findFirst: jest.fn().mockResolvedValue(profile),
      },
      ministryChildGuardian: { createMany: jest.fn().mockResolvedValue({ count: 2 }) },
    };
    mockPrismaClient.$transaction.mockImplementation(async (callback) => callback(tx));

    const result = await adapters.createMinistryChild(
      makeRequest({
        userId: "leader-1",
        params: { id: "kids-1" },
        body: {
          name: "Ana",
          birthDate: "2020-01-01",
          groupName: "Pequenos",
          guardians: [
            { rosterMemberId: "guardian-1" },
            { rosterMemberId: "guardian-1" },
            { rosterMemberId: "guardian-2" },
          ],
        },
      }),
    );

    expect(result).toEqual(profile);
    expect(tx.rosterMember.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Ana", crunchId: "church-1" }),
      }),
    );
    expect(tx.ministryChildGuardian.createMany).toHaveBeenCalledWith({
      data: [
        { childProfileId: "profile-1", guardianRosterMemberId: "guardian-1" },
        { childProfileId: "profile-1", guardianRosterMemberId: "guardian-2" },
      ],
      skipDuplicates: true,
    });
  });

  it("reutiliza o mesmo responsável já cadastrado para irmãos", async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "leader-1",
      crunchId: "church-1",
      role: "MEMBRO",
    });
    const childProfile = { id: "profile-2", departmentId: "kids-1", rosterMemberId: "child-2" };
    const tx = {
      rosterMember: {
        findFirst: jest.fn().mockResolvedValue({ id: "guardian-1", crunchId: "church-1" }),
        create: jest.fn().mockResolvedValue({ id: "child-2", crunchId: "church-1" }),
      },
      ministryChildProfile: {
        create: jest.fn().mockResolvedValue(childProfile),
        findFirst: jest.fn().mockResolvedValue(childProfile),
      },
      ministryChildGuardian: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    mockPrismaClient.$transaction.mockImplementation(async (callback) => callback(tx));

    await adapters.createMinistryChild(
      makeRequest({
        userId: "leader-1",
        params: { id: "kids-1" },
        body: { name: "Pedro", guardians: [{ rosterMemberId: "guardian-1" }] },
      }),
    );

    expect(tx.rosterMember.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "guardian-1", crunchId: "church-1" } }),
    );
    expect(tx.ministryChildGuardian.createMany).toHaveBeenCalledWith({
      data: [{ childProfileId: "profile-2", guardianRosterMemberId: "guardian-1" }],
      skipDuplicates: true,
    });
  });

  it("rejeita vínculo com responsável de outra igreja sem gravar o cadastro", async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "leader-1",
      crunchId: "church-1",
      role: "MEMBRO",
    });
    const tx = {
      rosterMember: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      ministryChildProfile: { create: jest.fn(), findFirst: jest.fn() },
      ministryChildGuardian: { createMany: jest.fn() },
    };
    mockPrismaClient.$transaction.mockImplementation(async (callback) => callback(tx));

    await expect(
      adapters.createMinistryChild(
        makeRequest({
          userId: "leader-1",
          params: { id: "kids-1" },
          body: { name: "Ana", guardians: [{ rosterMemberId: "guardian-from-another-church" }] },
        }),
      ),
    ).rejects.toThrow("Responsável não encontrado nesta igreja");
    expect(tx.ministryChildProfile.create).not.toHaveBeenCalled();
  });

  it("nega criação para equipe sem permissão de gestão", async () => {
    mockPrismaClient.userDepartmentMembership.findUnique.mockResolvedValue({ id: "member" });

    await expect(
      adapters.createMinistryChild(
        makeRequest({ params: { id: "kids-1" }, body: { name: "Ana" } }),
      ),
    ).rejects.toThrow(DomainError);
    expect(mockPrismaClient.$transaction).not.toHaveBeenCalled();
  });

  it("não apaga o histórico de chamada ao inativar uma criança ou editar responsáveis", async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "leader-1",
      crunchId: "church-1",
      role: "MEMBRO",
    });
    mockPrismaClient.ministryChildProfile.findFirst.mockResolvedValue({
      id: "profile-1",
      departmentId: "kids-1",
      rosterMemberId: "child-1",
      attendances: [{ id: "attendance-1", status: "PRESENT" }],
    });
    mockPrismaClient.ministryChildProfile.update.mockResolvedValue({
      id: "profile-1",
      isActive: false,
      attendances: [{ id: "attendance-1", status: "PRESENT" }],
    });
    mockPrismaClient.rosterMember.findFirst.mockResolvedValue({
      id: "guardian-2",
      crunchId: "church-1",
    });
    const tx = {
      ministryChildProfile: { findFirst: mockPrismaClient.ministryChildProfile.findFirst, update: mockPrismaClient.ministryChildProfile.update },
      rosterMember: {
        findFirst: mockPrismaClient.rosterMember.findFirst,
        update: jest.fn(),
      },
      ministryChildGuardian: { deleteMany: jest.fn(), createMany: jest.fn() },
    };
    mockPrismaClient.$transaction.mockImplementation(async (callback) => callback(tx));

    await adapters.updateMinistryChild(
      makeRequest({
        userId: "leader-1",
        params: { departmentId: "kids-1", childId: "profile-1" },
        body: {
          isActive: false,
          name: "Ana Maria",
          birthDate: "2020-02-03",
          guardianRosterMemberIds: ["guardian-2"],
        },
      }),
    );

    expect(tx.ministryChildProfile.update).toHaveBeenCalled();
    expect(tx.rosterMember.update).toHaveBeenCalledWith({
      where: { id: "child-1" },
      data: { name: "Ana Maria", birthDate: new Date("2020-02-03T00:00:00.000Z") },
    });
    expect(tx.ministryChildGuardian.deleteMany).toHaveBeenCalled();
    expect(mockPrismaClient.ministryChildAttendance.upsert).not.toHaveBeenCalled();
  });

  it("lista encontros somente do ministério Infantil autorizado", async () => {
    mockPrismaClient.userDepartmentMembership.findUnique.mockResolvedValue({ id: "team" });
    const sessions = [{ id: "session-1", departmentId: "kids-1", date: new Date("2026-10-04") }];
    mockPrismaClient.ministryChildSession.findMany.mockResolvedValue(sessions);

    const result = await adapters.getMinistryChildSessions(
      makeRequest({ params: { id: "kids-1" } }),
    );

    expect(result).toEqual(sessions);
    expect(mockPrismaClient.ministryChildSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { departmentId: "kids-1" } }),
    );
  });

  it("abre encontro e deixa cada criança ativa como PENDING até a equipe marcar", async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "leader-1",
      crunchId: "church-1",
      role: "MEMBRO",
    });
    const session = {
      id: "session-1",
      departmentId: "kids-1",
      date: new Date("2026-10-04T00:00:00.000Z"),
      groupName: "Pequenos",
      attendances: [],
    };
    const tx = {
      ministryChildSession: {
        create: jest.fn().mockResolvedValue({ id: "session-1" }),
        findFirst: jest.fn().mockResolvedValue(session),
      },
      ministryChildProfile: {
        findMany: jest.fn().mockResolvedValue([{ id: "child-1" }, { id: "child-2" }]),
      },
      ministryChildAttendance: { createMany: jest.fn().mockResolvedValue({ count: 2 }) },
    };
    mockPrismaClient.$transaction.mockImplementation(async (callback) => callback(tx));

    const result = await adapters.createMinistryChildSession(
      makeRequest({
        userId: "leader-1",
        params: { id: "kids-1" },
        body: { date: "2026-10-04", groupName: "Pequenos" },
      }),
    );

    expect(result).toEqual(session);
    expect(tx.ministryChildProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { departmentId: "kids-1", isActive: true, groupName: "Pequenos" },
      }),
    );
    expect(tx.ministryChildAttendance.createMany).toHaveBeenCalledWith({
      data: ["child-1", "child-2"].map((childProfileId) => ({
        id: expect.any(String),
        sessionId: "session-1",
        childProfileId,
        status: "PENDING",
      })),
      skipDuplicates: true,
    });
  });

  it.each(["PRESENT", "ABSENT"])(
    "registra chamada como %s sem transformar pendências em ausência",
    async (status) => {
      mockPrismaClient.userDepartmentMembership.findUnique.mockResolvedValue({ id: "team" });
      mockPrismaClient.ministryChildSession.findFirst.mockResolvedValue({
        id: "session-1",
        departmentId: "kids-1",
      });
      mockPrismaClient.ministryChildProfile.findFirst.mockResolvedValue({
        id: "child-1",
        departmentId: "kids-1",
      });
      mockPrismaClient.ministryChildAttendance.upsert.mockResolvedValue({
        id: "attendance-1",
        status,
      });

      const result = await adapters.updateMinistryChildAttendance(
        makeRequest({
          params: { departmentId: "kids-1", sessionId: "session-1", childId: "child-1" },
          body: { status },
        }),
      );

      expect(result).toEqual({ id: "attendance-1", status });
      expect(mockPrismaClient.ministryChildAttendance.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sessionId_childProfileId: { sessionId: "session-1", childProfileId: "child-1" } },
          create: expect.objectContaining({ status }),
          update: expect.objectContaining({ status }),
        }),
      );
    },
  );

  it("rejeita status não marcado e criança de outro ministério/igreja", async () => {
    mockPrismaClient.userDepartmentMembership.findUnique.mockResolvedValue({ id: "team" });
    await expect(
      adapters.updateMinistryChildAttendance(
        makeRequest({
          params: { departmentId: "kids-1", sessionId: "session-1", childId: "child-1" },
          body: { status: "PENDING" },
        }),
      ),
    ).rejects.toThrow("Status da chamada deve ser PRESENT ou ABSENT");
    expect(mockPrismaClient.ministryChildAttendance.upsert).not.toHaveBeenCalled();

    mockPrismaClient.ministryChildSession.findFirst.mockResolvedValue({
      id: "session-1",
      departmentId: "kids-1",
    });
    mockPrismaClient.ministryChildProfile.findFirst.mockResolvedValue(null);
    await expect(
      adapters.updateMinistryChildAttendance(
        makeRequest({
          params: { departmentId: "kids-1", sessionId: "session-1", childId: "child-from-another-church" },
          body: { status: "PRESENT" },
        }),
      ),
    ).rejects.toThrow("Criança não encontrada neste ministério");
    expect(mockPrismaClient.ministryChildAttendance.upsert).not.toHaveBeenCalled();
  });
});
