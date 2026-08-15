const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  dailyVerse: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import { FastifyRequest } from "fastify";
import { DailyVerseAdapters } from "../src/interfaces/adapters/dailyVerseAdapters";
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
  query?: Record<string, unknown>;
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
    query: options.query ?? {},
  } as unknown as FastifyRequest;
}

describe("DailyVerseAdapters", () => {
  let adapters: DailyVerseAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new DailyVerseAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({ id: "user-1", crunchId: "church-1" });
  });

  describe("getLatestDailyVerse", () => {
    it("returns the most recent verse for the active church", async () => {
      mockPrismaClient.dailyVerse.findFirst.mockResolvedValue({ id: "verse-1", text: "..." });

      const result = await adapters.getLatestDailyVerse(makeRequest({}));

      expect(result).toEqual({ id: "verse-1", text: "..." });
      expect(mockPrismaClient.dailyVerse.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { crunchId: "church-1" } }),
      );
    });
  });

  describe("listDailyVerses", () => {
    it("applies default pagination", async () => {
      mockPrismaClient.dailyVerse.findMany.mockResolvedValue([{ id: "verse-1" }]);
      mockPrismaClient.dailyVerse.count.mockResolvedValue(1);

      const result = await adapters.listDailyVerses(makeRequest({}));

      expect(result).toEqual({ items: [{ id: "verse-1" }], total: 1, page: 1, pageSize: 20 });
      expect(mockPrismaClient.dailyVerse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it("clamps pageSize to 50 and honors the requested page", async () => {
      mockPrismaClient.dailyVerse.findMany.mockResolvedValue([]);
      mockPrismaClient.dailyVerse.count.mockResolvedValue(0);

      const result = await adapters.listDailyVerses(
        makeRequest({ query: { page: "3", pageSize: "999" } }),
      );

      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(50);
      expect(mockPrismaClient.dailyVerse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 100, take: 50 }),
      );
    });
  });

  describe("createDailyVerse", () => {
    it("blocks a member without CONTENT_PUBLISH permission", async () => {
      const request = makeRequest({
        role: "MEMBRO",
        body: { text: "Deus é amor", reference: "1 João 4:8" },
      });
      await expect(adapters.createDailyVerse(request)).rejects.toThrow(DomainError);
    });

    it("throws when text is missing", async () => {
      const request = makeRequest({ body: { reference: "1 João 4:8" } });
      await expect(adapters.createDailyVerse(request)).rejects.toThrow(
        "Texto do versículo é obrigatório",
      );
    });

    it("throws when reference is missing", async () => {
      const request = makeRequest({ body: { text: "Deus é amor" } });
      await expect(adapters.createDailyVerse(request)).rejects.toThrow(
        "Referência bíblica é obrigatória",
      );
    });

    it("creates the verse for the active church", async () => {
      mockPrismaClient.dailyVerse.create.mockResolvedValue({ id: "verse-new" });

      const request = makeRequest({
        body: { text: "  Deus é amor  ", reference: "  1 João 4:8  ", isPublic: true },
      });
      const result = await adapters.createDailyVerse(request);

      expect(result).toEqual({ id: "verse-new" });
      const createArgs = mockPrismaClient.dailyVerse.create.mock.calls[0][0];
      expect(createArgs.data).toMatchObject({
        text: "Deus é amor",
        reference: "1 João 4:8",
        crunchId: "church-1",
        authorId: "user-1",
        isPublic: true,
      });
    });
  });

  describe("updateDailyVerse", () => {
    it("throws when no id param is provided", async () => {
      await expect(adapters.updateDailyVerse(makeRequest({ params: {} }))).rejects.toThrow(
        "Versículo não informado",
      );
    });

    it("throws when the verse does not belong to the active church", async () => {
      mockPrismaClient.dailyVerse.findFirst.mockResolvedValue(null);
      const request = makeRequest({ params: { id: "verse-1" }, body: { text: "novo" } });
      await expect(adapters.updateDailyVerse(request)).rejects.toThrow("Versículo não encontrado");
    });

    it("throws when text is explicitly cleared to empty", async () => {
      mockPrismaClient.dailyVerse.findFirst.mockResolvedValue({ id: "verse-1" });
      const request = makeRequest({ params: { id: "verse-1" }, body: { text: "   " } });
      await expect(adapters.updateDailyVerse(request)).rejects.toThrow(
        "Texto do versículo é obrigatório",
      );
    });

    it("updates only the fields present in the body", async () => {
      mockPrismaClient.dailyVerse.findFirst.mockResolvedValue({ id: "verse-1" });
      mockPrismaClient.dailyVerse.update.mockResolvedValue({ id: "verse-1", text: "Atualizado" });

      const request = makeRequest({ params: { id: "verse-1" }, body: { text: "Atualizado" } });
      const result = await adapters.updateDailyVerse(request);

      expect(result).toEqual({ id: "verse-1", text: "Atualizado" });
      expect(mockPrismaClient.dailyVerse.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "verse-1" }, data: { text: "Atualizado" } }),
      );
    });
  });

  describe("deleteDailyVerse", () => {
    it("throws when no id param is provided", async () => {
      await expect(adapters.deleteDailyVerse(makeRequest({ params: {} }))).rejects.toThrow(
        "Versículo não informado",
      );
    });

    it("throws when the verse does not belong to the active church", async () => {
      mockPrismaClient.dailyVerse.findFirst.mockResolvedValue(null);
      const request = makeRequest({ params: { id: "verse-1" } });
      await expect(adapters.deleteDailyVerse(request)).rejects.toThrow("Versículo não encontrado");
    });

    it("deletes the verse and returns success", async () => {
      mockPrismaClient.dailyVerse.findFirst.mockResolvedValue({ id: "verse-1" });
      mockPrismaClient.dailyVerse.delete.mockResolvedValue({ id: "verse-1" });

      const result = await adapters.deleteDailyVerse(makeRequest({ params: { id: "verse-1" } }));

      expect(result).toEqual({ success: true });
      expect(mockPrismaClient.dailyVerse.delete).toHaveBeenCalledWith({
        where: { id: "verse-1" },
      });
    });
  });
});
