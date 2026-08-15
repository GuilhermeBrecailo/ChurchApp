const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  crunch: { findUnique: jest.fn() },
  department: { findFirst: jest.fn() },
  mediaItem: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

jest.mock("../src/infrastructure/notifications/PushNotificationService", () => ({
  pushNotificationService: { sendToUsers: jest.fn(), sendPublicChurchContent: jest.fn() },
}));

const mockMkdir = jest.fn().mockResolvedValue(undefined);
const mockWriteFile = jest.fn().mockResolvedValue(undefined);

jest.mock("node:fs/promises", () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}));

import { FastifyRequest } from "fastify";
import { ChurchDepartmentAdapters } from "../src/interfaces/adapters/churchDepartmentAdapters";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(options: {
  role?: string;
  hasFeature?: boolean;
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  file?: () => Promise<
    { filename: string; mimetype: string; toBuffer: () => Promise<Buffer> } | undefined
  >;
}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("user-1")}`, ...(options.headers ?? {}) },
    churchContext: {
      activeChurchId: "church-1",
      role: options.role ?? "PASTOR",
      canManageMembers: true,
      roles: [],
      membershipId: "membership-1",
      hasFeature: () => options.hasFeature ?? true,
    },
    params: options.params ?? {},
    body: options.body ?? {},
    query: {},
    file: options.file,
  } as unknown as FastifyRequest;
}

const departmentRow = {
  id: "dept-1",
  name: "Midia",
  type: "OTHER",
  isActive: true,
  modules: ["RESOURCES"],
  leaderId: "leader-1",
  leader: { id: "leader-1", name: "Lider", email: "lider@igreja.com" },
  _count: { members: 0, schedules: 0, tasks: 0 },
  mediaItems: [],
};

const resourceRow = {
  id: "resource-1",
  title: "Roteiro do culto",
  url: "https://example.com/roteiro.pdf",
  category: "Geral",
  metadata: {},
  departmentId: "dept-1",
};

describe("ChurchDepartmentAdapters - recursos e upload de PDF", () => {
  let adapters: ChurchDepartmentAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new ChurchDepartmentAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      crunchId: "church-1",
      role: "PASTOR",
    });
    mockPrismaClient.crunch.findUnique.mockResolvedValue({ id: "church-1" });
    mockPrismaClient.department.findFirst.mockResolvedValue(departmentRow);
  });

  describe("createChurchDepartmentResource", () => {
    it("bloqueia no plano FREE", async () => {
      await expect(
        adapters.createChurchDepartmentResource(
          makeRequest({
            hasFeature: false,
            params: { id: "dept-1" },
            body: { title: "Roteiro", url: "https://example.com" },
          }),
        ),
      ).rejects.toThrow("Recursos do ministério estão disponíveis apenas no plano Pro");
    });

    it("rejeita titulo vazio", async () => {
      await expect(
        adapters.createChurchDepartmentResource(
          makeRequest({ params: { id: "dept-1" }, body: { title: "  ", url: "https://example.com" } }),
        ),
      ).rejects.toThrow("Título do recurso é obrigatório");
    });

    it("rejeita link vazio", async () => {
      await expect(
        adapters.createChurchDepartmentResource(
          makeRequest({ params: { id: "dept-1" }, body: { title: "Roteiro", url: "  " } }),
        ),
      ).rejects.toThrow("Link do recurso é obrigatório");
    });

    it("cria recurso com categoria default Geral", async () => {
      mockPrismaClient.mediaItem.create.mockResolvedValue(resourceRow);

      const result = await adapters.createChurchDepartmentResource(
        makeRequest({
          params: { id: "dept-1" },
          body: { title: "Roteiro do culto", url: "https://example.com/roteiro.pdf" },
        }),
      );

      expect(result.id).toBe("resource-1");
      expect(mockPrismaClient.mediaItem.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ category: "Geral" }) }),
      );
    });
  });

  describe("updateChurchDepartmentResource", () => {
    it("rejeita titulo vazio quando enviado", async () => {
      mockPrismaClient.mediaItem.findFirst.mockResolvedValue(resourceRow);

      await expect(
        adapters.updateChurchDepartmentResource(
          makeRequest({
            params: { departmentId: "dept-1", resourceId: "resource-1" },
            body: { title: "   " },
          }),
        ),
      ).rejects.toThrow("Titulo do recurso e obrigatorio");
    });

    it("rejeita link vazio quando enviado", async () => {
      mockPrismaClient.mediaItem.findFirst.mockResolvedValue(resourceRow);

      await expect(
        adapters.updateChurchDepartmentResource(
          makeRequest({
            params: { departmentId: "dept-1", resourceId: "resource-1" },
            body: { url: "   " },
          }),
        ),
      ).rejects.toThrow("Link do recurso e obrigatorio");
    });

    it("atualiza titulo mantendo metadata quando nao enviada", async () => {
      mockPrismaClient.mediaItem.findFirst.mockResolvedValue(resourceRow);
      mockPrismaClient.mediaItem.update.mockResolvedValue({ ...resourceRow, title: "Novo titulo" });

      const result = await adapters.updateChurchDepartmentResource(
        makeRequest({
          params: { departmentId: "dept-1", resourceId: "resource-1" },
          body: { title: "Novo titulo" },
        }),
      );

      expect(result.title).toBe("Novo titulo");
      expect(mockPrismaClient.mediaItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { title: "Novo titulo" } }),
      );
    });
  });

  describe("deleteChurchDepartmentResource", () => {
    it("apaga recurso do ministerio", async () => {
      mockPrismaClient.mediaItem.findFirst.mockResolvedValue(resourceRow);

      const result = await adapters.deleteChurchDepartmentResource(
        makeRequest({ params: { departmentId: "dept-1", resourceId: "resource-1" } }),
      );

      expect(result).toEqual({ success: true });
      expect(mockPrismaClient.mediaItem.delete).toHaveBeenCalledWith({ where: { id: "resource-1" } });
    });
  });

  describe("uploadChurchDepartmentPdf", () => {
    it("bloqueia no plano FREE", async () => {
      await expect(
        adapters.uploadChurchDepartmentPdf(
          makeRequest({ hasFeature: false, params: { id: "dept-1" } }),
        ),
      ).rejects.toThrow("Recursos do ministério estão disponíveis apenas no plano Pro");
    });

    it("rejeita quando nao envia arquivo", async () => {
      await expect(
        adapters.uploadChurchDepartmentPdf(
          makeRequest({ params: { id: "dept-1" }, file: async () => undefined }),
        ),
      ).rejects.toThrow("Arquivo PDF não enviado");
    });

    it("rejeita mimetype invalido", async () => {
      await expect(
        adapters.uploadChurchDepartmentPdf(
          makeRequest({
            params: { id: "dept-1" },
            file: async () => ({
              filename: "foto.png",
              mimetype: "image/png",
              toBuffer: async () => Buffer.from("x"),
            }),
          }),
        ),
      ).rejects.toThrow("Envie um arquivo PDF válido");
    });

    it("rejeita arquivo maior que 10MB", async () => {
      const bigBuffer = Buffer.alloc(10 * 1024 * 1024 + 1);

      await expect(
        adapters.uploadChurchDepartmentPdf(
          makeRequest({
            params: { id: "dept-1" },
            file: async () => ({
              filename: "grande.pdf",
              mimetype: "application/pdf",
              toBuffer: async () => bigBuffer,
            }),
          }),
        ),
      ).rejects.toThrow("O PDF deve ter no máximo 10 MB");
    });

    it("salva o arquivo, sanitiza o nome e devolve a url publica", async () => {
      const result = await adapters.uploadChurchDepartmentPdf(
        makeRequest({
          params: { id: "dept-1" },
          headers: { host: "localhost:8000" },
          file: async () => ({
            filename: "Roteiro Domingo (Ção).pdf",
            mimetype: "application/pdf",
            toBuffer: async () => Buffer.from("conteudo do pdf"),
          }),
        }),
      );

      expect(mockMkdir).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalled();
      expect(result.mimeType).toBe("application/pdf");
      expect(result.size).toBe(Buffer.from("conteudo do pdf").byteLength);
      expect(result.url).toContain("/uploads/church/church-1/departments/dept-1/");
      expect(result.fileName.toLowerCase().endsWith(".pdf")).toBe(true);
    });
  });
});
