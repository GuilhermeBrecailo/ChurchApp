const mockPrismaClient = {
  pageHelpVideo: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

const mockMkdir = jest.fn().mockResolvedValue(undefined);
const mockWriteFile = jest.fn().mockResolvedValue(undefined);

jest.mock("node:fs/promises", () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}));

import { FastifyRequest } from "fastify";
import { HelpVideoAdapters } from "../src/interfaces/adapters/helpVideoAdapters";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(options: {
  role?: string;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  noAuth?: boolean;
  file?: () => Promise<
    { filename: string; mimetype: string; toBuffer: () => Promise<Buffer> } | undefined
  >;
}): FastifyRequest {
  return {
    headers: options.noAuth
      ? { ...(options.headers ?? {}) }
      : { authorization: `Bearer ${fakeToken("user-1")}`, ...(options.headers ?? {}) },
    churchContext: {
      activeChurchId: "church-1",
      role: options.role ?? "ADMIN",
      canManageMembers: true,
      roles: [],
      membershipId: "membership-1",
      hasFeature: () => true,
    },
    params: options.params ?? {},
    query: options.query ?? {},
    body: options.body ?? {},
    file: options.file,
  } as unknown as FastifyRequest;
}

const videoRow = {
  pageKey: "home",
  label: "Como usar o inicio",
  description: null,
  contentType: "VIDEO",
  videoUrl: "https://example.com/video.mp4",
  steps: null,
  updatedAt: new Date("2026-01-01"),
};

describe("HelpVideoAdapters", () => {
  let adapters: HelpVideoAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new HelpVideoAdapters();
  });

  describe("list", () => {
    it("lista os videos de ajuda ordenados por pagina", async () => {
      mockPrismaClient.pageHelpVideo.findMany.mockResolvedValue([videoRow]);

      const result = await adapters.list();

      expect(result).toEqual([videoRow]);
      expect(mockPrismaClient.pageHelpVideo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { pageKey: "asc" } }),
      );
    });
  });

  describe("upsert", () => {
    it("bloqueia quando o usuario nao e admin de plataforma", async () => {
      await expect(
        adapters.upsert(
          makeRequest({
            role: "PASTOR",
            body: { pageKey: "home", label: "Titulo", contentType: "VIDEO", videoUrl: "https://x.com/v.mp4" },
          }),
        ),
      ).rejects.toThrow("Apenas administrador da plataforma pode gerenciar os videos de ajuda");
    });

    it("rejeita VIDEO sem videoUrl", async () => {
      await expect(
        adapters.upsert(makeRequest({ body: { pageKey: "home", label: "Titulo", contentType: "VIDEO" } })),
      ).rejects.toThrow();
    });

    it("rejeita STEPS sem nenhum passo", async () => {
      await expect(
        adapters.upsert(
          makeRequest({ body: { pageKey: "home", label: "Titulo", contentType: "STEPS", steps: [] } }),
        ),
      ).rejects.toThrow();
    });

    it("cria/atualiza video ordenando os passos por order", async () => {
      mockPrismaClient.pageHelpVideo.upsert.mockResolvedValue({
        ...videoRow,
        contentType: "STEPS",
        videoUrl: null,
        steps: [
          { order: 0, imageUrl: "", imageKey: "", caption: "Passo 1" },
          { order: 1, imageUrl: "", imageKey: "", caption: "Passo 2" },
        ],
      });

      const result = await adapters.upsert(
        makeRequest({
          body: {
            pageKey: "home",
            label: "Titulo",
            contentType: "STEPS",
            steps: [
              { order: 1, caption: "Passo 2" },
              { order: 0, caption: "Passo 1" },
            ],
          },
        }),
      );

      expect(result.contentType).toBe("STEPS");
      expect(mockPrismaClient.pageHelpVideo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { pageKey: "home" },
          create: expect.objectContaining({
            steps: [
              expect.objectContaining({ order: 0, caption: "Passo 1" }),
              expect.objectContaining({ order: 1, caption: "Passo 2" }),
            ],
          }),
        }),
      );
    });
  });

  describe("uploadVideo", () => {
    it("bloqueia quando o usuario nao e admin de plataforma", async () => {
      await expect(
        adapters.uploadVideo(makeRequest({ role: "PASTOR", query: { pageKey: "home" } })),
      ).rejects.toThrow("Apenas administrador da plataforma pode gerenciar os videos de ajuda");
    });

    it("rejeita quando pageKey nao informado", async () => {
      await expect(adapters.uploadVideo(makeRequest({ query: {} }))).rejects.toThrow(
        "Pagina nao informada",
      );
    });

    it("rejeita quando nenhum arquivo enviado", async () => {
      await expect(
        adapters.uploadVideo(makeRequest({ query: { pageKey: "home" }, file: async () => undefined })),
      ).rejects.toThrow("Video nao enviado");
    });

    it("rejeita mimetype invalido", async () => {
      await expect(
        adapters.uploadVideo(
          makeRequest({
            query: { pageKey: "home" },
            file: async () => ({
              filename: "a.mov",
              mimetype: "video/quicktime",
              toBuffer: async () => Buffer.from("x"),
            }),
          }),
        ),
      ).rejects.toThrow("Envie um video MP4, WebM ou OGG");
    });

    it("rejeita video maior que 100MB", async () => {
      const bigBuffer = Buffer.alloc(100 * 1024 * 1024 + 1);

      await expect(
        adapters.uploadVideo(
          makeRequest({
            query: { pageKey: "home" },
            file: async () => ({
              filename: "grande.mp4",
              mimetype: "video/mp4",
              toBuffer: async () => bigBuffer,
            }),
          }),
        ),
      ).rejects.toThrow("O video deve ter no maximo 100 MB");
    });

    it("salva o video e devolve a url publica", async () => {
      const result = await adapters.uploadVideo(
        makeRequest({
          query: { pageKey: "/Ministerios/Louvor" },
          headers: { host: "localhost:8000" },
          file: async () => ({
            filename: "tutorial.mp4",
            mimetype: "video/mp4",
            toBuffer: async () => Buffer.from("conteudo"),
          }),
        }),
      );

      expect(mockMkdir).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalled();
      expect(result.mimeType).toBe("video/mp4");
      expect(result.url).toContain("/uploads/help-videos/ministerios-louvor/");
    });
  });

  describe("uploadImage", () => {
    it("rejeita mimetype invalido", async () => {
      await expect(
        adapters.uploadImage(
          makeRequest({
            query: { pageKey: "home" },
            file: async () => ({
              filename: "a.gif",
              mimetype: "image/gif",
              toBuffer: async () => Buffer.from("x"),
            }),
          }),
        ),
      ).rejects.toThrow("Envie uma imagem JPEG, PNG ou WebP");
    });

    it("salva a imagem do passo e devolve a url publica", async () => {
      const result = await adapters.uploadImage(
        makeRequest({
          query: { pageKey: "home" },
          headers: { host: "localhost:8000" },
          file: async () => ({
            filename: "passo1.png",
            mimetype: "image/png",
            toBuffer: async () => Buffer.from("conteudo"),
          }),
        }),
      );

      expect(result.mimeType).toBe("image/png");
      expect(result.url).toContain("/uploads/help-content/home/");
    });
  });

  describe("remove", () => {
    it("rejeita quando pageKey nao informado", async () => {
      await expect(adapters.remove(makeRequest({ query: {} }))).rejects.toThrow(
        "Pagina nao informada",
      );
    });

    it("remove o video de ajuda da pagina", async () => {
      const result = await adapters.remove(makeRequest({ query: { pageKey: "home" } }));

      expect(result).toEqual({ success: true });
      expect(mockPrismaClient.pageHelpVideo.deleteMany).toHaveBeenCalledWith({
        where: { pageKey: "home" },
      });
    });
  });
});
