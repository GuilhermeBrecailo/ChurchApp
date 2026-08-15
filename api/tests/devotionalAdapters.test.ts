const mockTx = {
  devotional: { create: jest.fn(), update: jest.fn() },
  devotionalChapter: { deleteMany: jest.fn() },
};

const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  devotional: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
  devotionalComment: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
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

function makeRequest(options: {
  role?: string;
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("user-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role: options.role ?? "PASTOR",
      canManageMembers: true,
      roles: [],
      membershipId: "membership-1",
      hasFeature: () => true,
    },
    params: options.params ?? {},
    body: options.body ?? {},
  } as unknown as FastifyRequest;
}

const validChapters = [{ title: "Cap 1", content: "Conteúdo", bibleRef: "Sl 1" }];

describe("DevotionalAdapters", () => {
  let adapters: DevotionalAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new DevotionalAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({ id: "user-1", crunchId: "church-1" });
  });

  describe("listDevotionals", () => {
    it("lists devotionals scoped to the active church", async () => {
      mockPrismaClient.devotional.findMany.mockResolvedValue([{ id: "dev-1" }]);

      const result = await adapters.listDevotionals(makeRequest({}));

      expect(result).toEqual([{ id: "dev-1" }]);
      expect(mockPrismaClient.devotional.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { crunchId: "church-1" } }),
      );
    });
  });

  describe("getDevotional", () => {
    it("throws when no id param is provided", async () => {
      await expect(adapters.getDevotional(makeRequest({ params: {} }))).rejects.toThrow(
        "Devocional não informado",
      );
    });

    it("throws when the devotional does not belong to the active church", async () => {
      mockPrismaClient.devotional.findFirst.mockResolvedValue(null);
      await expect(
        adapters.getDevotional(makeRequest({ params: { id: "dev-1" } })),
      ).rejects.toThrow("Devocional não encontrado");
    });

    it("returns the devotional with its chapters", async () => {
      mockPrismaClient.devotional.findFirst.mockResolvedValue({ id: "dev-1", chapters: [] });
      const result = await adapters.getDevotional(makeRequest({ params: { id: "dev-1" } }));
      expect(result).toEqual({ id: "dev-1", chapters: [] });
    });
  });

  describe("createDevotional", () => {
    it("blocks a member without CONTENT_PUBLISH permission", async () => {
      const request = makeRequest({
        role: "MEMBRO",
        body: { title: "Fé", chapters: validChapters },
      });
      await expect(adapters.createDevotional(request)).rejects.toThrow(DomainError);
    });

    it("throws when title is missing", async () => {
      const request = makeRequest({ body: { chapters: validChapters } });
      await expect(adapters.createDevotional(request)).rejects.toThrow(
        "Título do devocional é obrigatório",
      );
    });

    it("throws when there are no valid chapters", async () => {
      const request = makeRequest({ body: { title: "Fé", chapters: [{ title: "", content: "" }] } });
      await expect(adapters.createDevotional(request)).rejects.toThrow(
        "Informe ao menos um capítulo",
      );
    });

    it("creates the devotional with its chapters", async () => {
      mockTx.devotional.create.mockResolvedValue({ id: "dev-new" });

      const request = makeRequest({ body: { title: "Fé", chapters: validChapters } });
      const result = await adapters.createDevotional(request);

      expect(result).toEqual({ id: "dev-new" });
      const createArgs = mockTx.devotional.create.mock.calls[0][0];
      expect(createArgs.data.title).toBe("Fé");
      expect(createArgs.data.chapters.create).toHaveLength(1);
      expect(createArgs.data.chapters.create[0]).toMatchObject({
        title: "Cap 1",
        content: "Conteúdo",
        order: 1,
      });
    });
  });

  describe("updateDevotional", () => {
    it("throws when no id param is provided", async () => {
      await expect(adapters.updateDevotional(makeRequest({ params: {} }))).rejects.toThrow(
        "Devocional não informado",
      );
    });

    it("throws when the devotional does not belong to the active church", async () => {
      mockPrismaClient.devotional.findFirst.mockResolvedValue(null);
      const request = makeRequest({ params: { id: "dev-1" }, body: { title: "Novo" } });
      await expect(adapters.updateDevotional(request)).rejects.toThrow("Devocional não encontrado");
    });

    it("throws when title is explicitly cleared to empty", async () => {
      mockPrismaClient.devotional.findFirst.mockResolvedValue({ id: "dev-1" });
      const request = makeRequest({ params: { id: "dev-1" }, body: { title: "   " } });
      await expect(adapters.updateDevotional(request)).rejects.toThrow(
        "Título do devocional é obrigatório",
      );
    });

    it("throws when chapters are provided but none are valid", async () => {
      mockPrismaClient.devotional.findFirst.mockResolvedValue({ id: "dev-1" });
      const request = makeRequest({
        params: { id: "dev-1" },
        body: { chapters: [{ title: "", content: "" }] },
      });
      await expect(adapters.updateDevotional(request)).rejects.toThrow(
        "Informe ao menos um capítulo",
      );
    });

    it("updates fields without touching chapters when none are sent", async () => {
      mockPrismaClient.devotional.findFirst.mockResolvedValue({ id: "dev-1" });
      mockTx.devotional.update.mockResolvedValue({ id: "dev-1", title: "Atualizado" });

      const request = makeRequest({ params: { id: "dev-1" }, body: { title: "Atualizado" } });
      const result = await adapters.updateDevotional(request);

      expect(result).toEqual({ id: "dev-1", title: "Atualizado" });
      expect(mockTx.devotionalChapter.deleteMany).not.toHaveBeenCalled();
      const updateArgs = mockTx.devotional.update.mock.calls[0][0];
      expect(updateArgs.data).toEqual({ title: "Atualizado" });
    });

    it("replaces chapters when a new chapter list is sent", async () => {
      mockPrismaClient.devotional.findFirst.mockResolvedValue({ id: "dev-1" });
      mockTx.devotional.update.mockResolvedValue({ id: "dev-1" });

      const request = makeRequest({
        params: { id: "dev-1" },
        body: { chapters: validChapters },
      });
      await adapters.updateDevotional(request);

      expect(mockTx.devotionalChapter.deleteMany).toHaveBeenCalledWith({
        where: { devotionalId: "dev-1" },
      });
      const updateArgs = mockTx.devotional.update.mock.calls[0][0];
      expect(updateArgs.data.chapters.create).toHaveLength(1);
    });
  });

  describe("deleteDevotional", () => {
    it("throws when no id param is provided", async () => {
      await expect(adapters.deleteDevotional(makeRequest({ params: {} }))).rejects.toThrow(
        "Devocional não informado",
      );
    });

    it("throws when the devotional does not belong to the active church", async () => {
      mockPrismaClient.devotional.findFirst.mockResolvedValue(null);
      await expect(
        adapters.deleteDevotional(makeRequest({ params: { id: "dev-1" } })),
      ).rejects.toThrow("Devocional não encontrado");
    });

    it("deletes the devotional and returns success", async () => {
      mockPrismaClient.devotional.findFirst.mockResolvedValue({ id: "dev-1" });
      mockPrismaClient.devotional.delete.mockResolvedValue({ id: "dev-1" });

      const result = await adapters.deleteDevotional(makeRequest({ params: { id: "dev-1" } }));

      expect(result).toEqual({ success: true });
      expect(mockPrismaClient.devotional.delete).toHaveBeenCalledWith({ where: { id: "dev-1" } });
    });
  });

  describe("listComments", () => {
    it("throws when no id param is provided", async () => {
      await expect(adapters.listComments(makeRequest({ params: {} }))).rejects.toThrow(
        "Devocional não informado",
      );
    });

    it("throws when the devotional does not belong to the active church", async () => {
      mockPrismaClient.devotional.findFirst.mockResolvedValue(null);
      await expect(
        adapters.listComments(makeRequest({ params: { id: "dev-1" } })),
      ).rejects.toThrow("Devocional não encontrado");
    });

    it("lists comments oldest first with author info", async () => {
      mockPrismaClient.devotional.findFirst.mockResolvedValue({ id: "dev-1" });
      mockPrismaClient.devotionalComment.findMany.mockResolvedValue([{ id: "comment-1" }]);

      const result = await adapters.listComments(makeRequest({ params: { id: "dev-1" } }));

      expect(result).toEqual([{ id: "comment-1" }]);
      expect(mockPrismaClient.devotionalComment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { devotionalId: "dev-1" },
          orderBy: { createdAt: "asc" },
        }),
      );
    });
  });

  describe("createComment", () => {
    it("throws when the comment body is empty", async () => {
      const request = makeRequest({ params: { id: "dev-1" }, body: { body: "   " } });
      await expect(adapters.createComment(request)).rejects.toThrow(
        "Comentário não pode ser vazio",
      );
    });

    it("throws when the devotional does not belong to the active church", async () => {
      mockPrismaClient.devotional.findFirst.mockResolvedValue(null);
      const request = makeRequest({ params: { id: "dev-1" }, body: { body: "Amém!" } });
      await expect(adapters.createComment(request)).rejects.toThrow("Devocional não encontrado");
    });

    it("creates the comment for the authenticated member, no approval needed", async () => {
      mockPrismaClient.devotional.findFirst.mockResolvedValue({ id: "dev-1" });
      mockPrismaClient.devotionalComment.create.mockResolvedValue({
        id: "comment-1",
        body: "Amém!",
      });

      const request = makeRequest({
        role: "MEMBRO",
        params: { id: "dev-1" },
        body: { body: "Amém!" },
      });
      const result = await adapters.createComment(request);

      expect(result).toEqual({ id: "comment-1", body: "Amém!" });
      const createArgs = mockPrismaClient.devotionalComment.create.mock.calls[0][0];
      expect(createArgs.data).toMatchObject({
        body: "Amém!",
        devotionalId: "dev-1",
        authorId: "user-1",
        crunchId: "church-1",
      });
    });
  });

  describe("deleteComment", () => {
    it("throws when no commentId param is provided", async () => {
      await expect(
        adapters.deleteComment(makeRequest({ params: { id: "dev-1" } })),
      ).rejects.toThrow("Comentário não informado");
    });

    it("throws when the comment does not belong to the active church's devotional", async () => {
      mockPrismaClient.devotionalComment.findFirst.mockResolvedValue(null);
      const request = makeRequest({ params: { id: "dev-1", commentId: "comment-1" } });
      await expect(adapters.deleteComment(request)).rejects.toThrow("Comentário não encontrado");
    });

    it("lets the author delete their own comment", async () => {
      mockPrismaClient.devotionalComment.findFirst.mockResolvedValue({
        id: "comment-1",
        authorId: "user-1",
      });
      const request = makeRequest({
        role: "MEMBRO",
        params: { id: "dev-1", commentId: "comment-1" },
      });

      const result = await adapters.deleteComment(request);

      expect(result).toEqual({ success: true });
      expect(mockPrismaClient.devotionalComment.delete).toHaveBeenCalledWith({
        where: { id: "comment-1" },
      });
    });

    it("lets a pastor delete someone else's comment", async () => {
      mockPrismaClient.devotionalComment.findFirst.mockResolvedValue({
        id: "comment-1",
        authorId: "other-user",
      });
      const request = makeRequest({
        role: "PASTOR",
        params: { id: "dev-1", commentId: "comment-1" },
      });

      const result = await adapters.deleteComment(request);

      expect(result).toEqual({ success: true });
    });

    it("blocks a member from deleting someone else's comment", async () => {
      mockPrismaClient.devotionalComment.findFirst.mockResolvedValue({
        id: "comment-1",
        authorId: "other-user",
      });
      const request = makeRequest({
        role: "MEMBRO",
        params: { id: "dev-1", commentId: "comment-1" },
      });

      await expect(adapters.deleteComment(request)).rejects.toThrow(
        "Você não tem permissão para apagar este comentário",
      );
    });
  });
});
