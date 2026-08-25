const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  post: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
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
import { PostAdapters } from "../src/interfaces/adapters/postAdapters";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(options: {
  role?: string;
  roles?: { scope: string; departmentId: string | null; permissions: string[] }[];
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
      roles: options.roles ?? [],
      membershipId: "membership-1",
      hasFeature: () => true,
    },
    params: options.params ?? {},
    body: options.body ?? {},
    file: options.file,
  } as unknown as FastifyRequest;
}

const postRow = {
  id: "post-1",
  title: "Bazar da igreja",
  body: "Vem ai!",
  imageUrl: null,
  imageKey: null,
  videoUrl: null,
  isPublic: true,
  pinned: false,
  crunchId: "church-1",
  authorId: "user-1",
};

describe("PostAdapters", () => {
  let adapters: PostAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new PostAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({ id: "user-1", crunchId: "church-1" });
  });

  describe("listPosts", () => {
    it("bloqueia membro sem permissao de publicar conteudo", async () => {
      await expect(adapters.listPosts(makeRequest({ role: "MEMBRO" }))).rejects.toThrow(
        "Voce nao tem permissao para publicar conteudo da igreja",
      );
    });

    it("lista as publicacoes da igreja ativa", async () => {
      mockPrismaClient.post.findMany.mockResolvedValue([postRow]);

      const result = await adapters.listPosts(makeRequest({}));

      expect(result).toEqual([postRow]);
      expect(mockPrismaClient.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { crunchId: "church-1" } }),
      );
    });
  });

  describe("createPost", () => {
    it("rejeita titulo vazio", async () => {
      await expect(
        adapters.createPost(makeRequest({ body: { title: "  " } })),
      ).rejects.toThrow("Titulo da publicacao e obrigatorio");
    });

    it("cria a publicacao vinculada a igreja e ao autor", async () => {
      mockPrismaClient.post.create.mockResolvedValue(postRow);

      const result = await adapters.createPost(
        makeRequest({ body: { title: "Bazar da igreja", body: "Vem ai!" } }),
      );

      expect(result.id).toBe("post-1");
      expect(mockPrismaClient.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ crunchId: "church-1", authorId: "user-1" }),
        }),
      );
    });

    it("permite membro com permissao CONTENT_PUBLISH de cargo", async () => {
      mockPrismaClient.post.create.mockResolvedValue(postRow);

      const result = await adapters.createPost(
        makeRequest({
          role: "MEMBRO",
          roles: [{ scope: "CHURCH", departmentId: null, permissions: ["CONTENT_PUBLISH"] }],
          body: { title: "Bazar da igreja" },
        }),
      );

      expect(result.id).toBe("post-1");
    });
  });

  describe("updatePost", () => {
    it("rejeita quando id nao informado", async () => {
      await expect(adapters.updatePost(makeRequest({ params: {} }))).rejects.toThrow(
        "Publicacao nao informada",
      );
    });

    it("rejeita quando a publicacao nao pertence a igreja ativa", async () => {
      mockPrismaClient.post.findFirst.mockResolvedValue(null);

      await expect(
        adapters.updatePost(makeRequest({ params: { id: "post-1" }, body: { title: "Novo" } })),
      ).rejects.toThrow("Publicacao nao encontrada");
    });

    it("rejeita titulo vazio quando enviado", async () => {
      mockPrismaClient.post.findFirst.mockResolvedValue(postRow);

      await expect(
        adapters.updatePost(makeRequest({ params: { id: "post-1" }, body: { title: "   " } })),
      ).rejects.toThrow("Titulo da publicacao e obrigatorio");
    });

    it("atualiza mantendo campos nao enviados", async () => {
      mockPrismaClient.post.findFirst.mockResolvedValue(postRow);
      mockPrismaClient.post.update.mockResolvedValue({ ...postRow, pinned: true });

      const result = await adapters.updatePost(
        makeRequest({ params: { id: "post-1" }, body: { pinned: true } }),
      );

      expect(result.pinned).toBe(true);
      expect(mockPrismaClient.post.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ title: postRow.title, pinned: true }) }),
      );
    });
  });

  describe("deletePost", () => {
    it("rejeita quando a publicacao nao pertence a igreja ativa", async () => {
      mockPrismaClient.post.findFirst.mockResolvedValue(null);

      await expect(
        adapters.deletePost(makeRequest({ params: { id: "post-1" } })),
      ).rejects.toThrow("Publicacao nao encontrada");
    });

    it("apaga a publicacao", async () => {
      mockPrismaClient.post.findFirst.mockResolvedValue(postRow);

      const result = await adapters.deletePost(makeRequest({ params: { id: "post-1" } }));

      expect(result).toEqual({ success: true });
      expect(mockPrismaClient.post.delete).toHaveBeenCalledWith({ where: { id: "post-1" } });
    });
  });

  describe("uploadImage", () => {
    it("rejeita quando nenhum arquivo enviado", async () => {
      await expect(
        adapters.uploadImage(makeRequest({ file: async () => undefined })),
      ).rejects.toThrow("Imagem nao enviada");
    });

    it("rejeita mimetype invalido", async () => {
      await expect(
        adapters.uploadImage(
          makeRequest({
            file: async () => ({ filename: "a.gif", mimetype: "image/gif", toBuffer: async () => Buffer.from("x") }),
          }),
        ),
      ).rejects.toThrow("Envie uma imagem JPEG, PNG ou WebP");
    });

    it("rejeita imagem maior que 5MB", async () => {
      const bigBuffer = Buffer.alloc(5 * 1024 * 1024 + 1);

      await expect(
        adapters.uploadImage(
          makeRequest({
            file: async () => ({ filename: "a.png", mimetype: "image/png", toBuffer: async () => bigBuffer }),
          }),
        ),
      ).rejects.toThrow("A imagem deve ter no maximo 5 MB");
    });

    it("salva a imagem escopada por igreja e devolve a url publica", async () => {
      const result = await adapters.uploadImage(
        makeRequest({
          headers: { host: "localhost:8000" },
          file: async () => ({
            filename: "bazar.png",
            mimetype: "image/png",
            toBuffer: async () => Buffer.from("conteudo"),
          }),
        }),
      );

      expect(mockMkdir).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalled();
      expect(result.url).toContain("/uploads/church/church-1/posts/");
    });

    it("permite upload para cargo com permissao de criar culto", async () => {
      const result = await adapters.uploadImage(
        makeRequest({
          role: "MEMBRO",
          roles: [{ scope: "CHURCH", departmentId: null, permissions: ["CULT_CREATE"] }],
          file: async () => ({
            filename: "culto.png",
            mimetype: "image/png",
            toBuffer: async () => Buffer.from("imagem"),
          }),
        }),
      );

      expect(mockWriteFile).toHaveBeenCalled();
      expect(result.key).toContain("/posts/");
    });
  });
});
