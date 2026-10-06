const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  crunch: { findUnique: jest.fn() },
  department: { findFirst: jest.fn() },
  userDepartmentMembership: { findUnique: jest.fn() },
  mediaItem: { findMany: jest.fn(), findFirst: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

jest.mock("../src/application/use-cases/Auth/JwtValidationUseCase", () => ({
  JwtValidationUseCase: jest.fn().mockImplementation(() => ({ execute: jest.fn() })),
}));

import { FastifyReply, FastifyRequest } from "fastify";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { ChurchDepartmentAdapters } from "../src/interfaces/adapters/churchDepartmentAdapters";
import TenantHandler from "../src/interfaces/plugins/TenantHandler";
import { DomainError } from "../src/domain/value-objects/utils/DomainError";

function fakeToken(userId = "user-1") {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(options: {
  userId?: string;
  role?: string;
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken(options.userId)}` },
    churchContext: {
      activeChurchId: "church-1",
      role: options.role ?? "MEMBRO",
      canManageMembers: false,
      roles: [],
      membershipId: "membership-1",
      hasFeature: () => true,
    },
    params: options.params ?? {},
    body: options.body ?? {},
    query: {},
  } as unknown as FastifyRequest;
}

function makeReply() {
  const reply = {
    sent: false,
    type: jest.fn(function (this: { type: jest.Mock }) { return this; }),
    header: jest.fn(function (this: { header: jest.Mock }) { return this; }),
    send: jest.fn(function (this: { sent: boolean }) {
      this.sent = true;
      return this;
    }),
  };
  return reply as unknown as FastifyReply;
}

const kidsDepartment = {
  id: "kids-1",
  name: "Ministério Infantil",
  type: "KIDS",
  isActive: true,
  modules: ["CLASSES"],
  leaderId: "leader-1",
  leader: { id: "leader-1", name: "Líder", email: "lider@igreja.com" },
  _count: { members: 1, schedules: 0, tasks: 0 },
  mediaItems: [],
};

describe("Ministério Infantil - PDFs protegidos", () => {
  let adapters: ChurchDepartmentAdapters;
  let originalCwd: string;
  let temporaryRoot: string;

  beforeAll(async () => {
    originalCwd = process.cwd();
    temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "churchapp-kids-pdf-"));
    process.chdir(temporaryRoot);
    await mkdir("uploads/church/church-1/departments/kids-1", { recursive: true });
    await mkdir("uploads/church/church-1/departments/other-1", { recursive: true });
    await writeFile(
      "uploads/church/church-1/departments/kids-1/aula.pdf",
      Buffer.from("%PDF-1.7 conteúdo restrito"),
    );
    await writeFile(
      "uploads/church/church-1/departments/other-1/arquivo.pdf",
      Buffer.from("%PDF-1.7 conteúdo público"),
    );
  });

  afterAll(async () => {
    process.chdir(originalCwd);
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new ChurchDepartmentAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      crunchId: "church-1",
      role: "MEMBRO",
    });
    mockPrismaClient.crunch.findUnique.mockResolvedValue({ id: "church-1" });
    mockPrismaClient.department.findFirst.mockResolvedValue(kidsDepartment);
    mockPrismaClient.userDepartmentMembership.findUnique.mockResolvedValue({ id: "team" });
  });

  it("lista somente atividades e não devolve URL ou chave pública do arquivo", async () => {
    mockPrismaClient.mediaItem.findMany.mockResolvedValue([
      {
        id: "activity-1",
        title: "Aula de domingo",
        category: "ACTIVITY",
        url: "https://api.exemplo/uploads/church/church-1/departments/kids-1/aula.pdf",
        metadata: {
          notes: "Lição sobre amizade",
          pdf: {
            key: "church/church-1/departments/kids-1/aula.pdf",
            url: "https://api.exemplo/uploads/church/church-1/departments/kids-1/aula.pdf",
            fileName: "aula.pdf",
            mimeType: "application/pdf",
            size: 100,
          },
        },
      },
    ]);

    const result = await adapters.getMinistryChildMaterials(
      makeRequest({ params: { id: "kids-1" } }),
    );

    expect(result).toEqual([
      {
        id: "activity-1",
        title: "Aula de domingo",
        category: "ACTIVITY",
        notes: "Lição sobre amizade",
        pdf: { fileName: "aula.pdf", mimeType: "application/pdf", size: 100 },
      },
    ]);
    expect(JSON.stringify(result)).not.toContain("/uploads/");
    expect(JSON.stringify(result)).not.toContain("church/church-1/departments");
  });

  it("não expõe atividades do Infantil pelo endpoint genérico de recursos", async () => {
    mockPrismaClient.mediaItem.findMany.mockResolvedValue([]);

    await adapters.getChurchDepartmentResources(
      makeRequest({ params: { id: "kids-1" } }),
    );

    expect(mockPrismaClient.mediaItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          departmentId: "kids-1",
          category: { not: "ACTIVITY" },
        }),
      }),
    );
  });

  it("nega a lista e o PDF para pessoas que não pertencem à equipe", async () => {
    mockPrismaClient.userDepartmentMembership.findUnique.mockResolvedValue(null);

    await expect(
      adapters.getMinistryChildMaterials(makeRequest({ params: { id: "kids-1" } })),
    ).rejects.toThrow(DomainError);
    const reply = makeReply();
    await expect(
      adapters.streamMinistryChildMaterialPdf(
        makeRequest({ params: { departmentId: "kids-1", resourceId: "activity-1" } }),
        reply,
      ),
    ).rejects.toThrow(DomainError);
    expect(reply.send).not.toHaveBeenCalled();
  });

  it("envia o PDF somente depois de validar departamento e igreja", async () => {
    mockPrismaClient.mediaItem.findFirst.mockResolvedValue({
      id: "activity-1",
      title: "Aula de domingo",
      category: "ACTIVITY",
      departmentId: "kids-1",
      url: "https://api.exemplo/uploads/church/church-1/departments/kids-1/aula.pdf",
      metadata: {
        pdf: {
          key: "church/church-1/departments/kids-1/aula.pdf",
          fileName: "aula.pdf",
          mimeType: "application/pdf",
        },
      },
    });
    const reply = makeReply();

    await adapters.streamMinistryChildMaterialPdf(
      makeRequest({ params: { departmentId: "kids-1", resourceId: "activity-1" } }),
      reply,
    );

    expect(mockPrismaClient.mediaItem.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "activity-1",
          departmentId: "kids-1",
          department: { crunchId: "church-1" },
        },
      }),
    );
    expect(reply.type).toHaveBeenCalledWith("application/pdf");
    expect(reply.header).toHaveBeenCalledWith("Cache-Control", "private, no-store");
    expect(reply.send).toHaveBeenCalledWith(Buffer.from("%PDF-1.7 conteúdo restrito"));
  });

  it("não entrega recurso de outra igreja nem aceita caminho de arquivo enviado pelo cliente", async () => {
    mockPrismaClient.mediaItem.findFirst.mockResolvedValue(null);
    const reply = makeReply();

    await expect(
      adapters.streamMinistryChildMaterialPdf(
        makeRequest({
          params: { departmentId: "kids-1", resourceId: "resource-from-another-church" },
          body: { path: "../../etc/passwd" },
        }),
        reply,
      ),
    ).rejects.toThrow("Recurso nao encontrado neste ministerio");
    expect(reply.send).not.toHaveBeenCalled();
  });

  it("bloqueia acesso anônimo ao arquivo do Infantil pelo caminho estático, sem quebrar outros uploads", async () => {
    mockPrismaClient.department.findFirst.mockImplementation(async ({ where }: { where: { id: string } }) => {
      if (where.id === "kids-1") return { id: "kids-1", type: "KIDS" };
      return { id: where.id, type: "OTHER" };
    });
    const app = Fastify();
    await app.register(TenantHandler);
    await app.register(fastifyStatic, {
      root: path.join(temporaryRoot, "uploads"),
      prefix: "/uploads/",
    });

    const protectedFile = await app.inject({
      method: "GET",
      url: "/uploads/church/church-1/departments/kids-1/aula.pdf",
    });
    const publicFile = await app.inject({
      method: "GET",
      url: "/uploads/church/church-1/departments/other-1/arquivo.pdf",
    });

    expect(protectedFile.statusCode).toBe(404);
    expect(publicFile.statusCode).toBe(200);
    expect(publicFile.headers["content-type"]).toContain("application/pdf");
    await app.close();
  });
});
