const mockPrismaClient = {
  crunch: { findUnique: jest.fn(), findMany: jest.fn() },
  serviceTime: { findMany: jest.fn() },
  announcement: { findMany: jest.fn() },
  dailyVerse: { findMany: jest.fn() },
  devotional: { findMany: jest.fn() },
  post: { findMany: jest.fn() },
  pushSubscription: { upsert: jest.fn(), deleteMany: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import { FastifyReply, FastifyRequest } from "fastify";
import { PublicChurchAdapters } from "../src/interfaces/adapters/publicChurchAdapters";

function makeRequest(params: Record<string, unknown>, body?: Record<string, unknown>): FastifyRequest {
  return { params, body: body ?? {} } as unknown as FastifyRequest;
}

function makeReply(): FastifyReply {
  const reply = {
    code: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return reply as unknown as FastifyReply;
}

const churchRow = {
  id: "church-1",
  name: "Igreja Central",
  slug: "igreja-central",
  logo: null,
  accentColor: null,
  textColor: null,
  fontFamily: null,
  isActive: true,
  city: "Sao Paulo",
  state: "SP",
  road: "Rua A",
  number: "100",
  complement: null,
  localZipCode: "01000-000",
  phone: "1111-1111",
  whatsapp: null,
  email: "contato@igreja.com",
  instagram: "@igreja",
  facebook: null,
  youtube: null,
  website: null,
};

describe("PublicChurchAdapters", () => {
  let adapters: PublicChurchAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new PublicChurchAdapters();
    mockPrismaClient.serviceTime.findMany.mockResolvedValue([]);
    mockPrismaClient.announcement.findMany.mockResolvedValue([]);
    mockPrismaClient.dailyVerse.findMany.mockResolvedValue([]);
    mockPrismaClient.devotional.findMany.mockResolvedValue([]);
    mockPrismaClient.post.findMany.mockResolvedValue([]);
  });

  describe("listSitemapSlugs", () => {
    it("lista os slugs das igrejas ativas pro sitemap", async () => {
      mockPrismaClient.crunch.findMany.mockResolvedValue([
        { slug: "igreja-central", createdAt: new Date("2026-01-01") },
      ]);

      const result = await adapters.listSitemapSlugs();

      expect(result).toEqual([{ slug: "igreja-central", updatedAt: new Date("2026-01-01") }]);
      expect(mockPrismaClient.crunch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
    });
  });

  describe("getChurch", () => {
    it("responde 404 quando a igreja nao existe", async () => {
      mockPrismaClient.crunch.findUnique.mockResolvedValue(null);
      const reply = makeReply();

      await adapters.getChurch(makeRequest({ slug: "nao-existe" }), reply);

      expect(reply.code).toHaveBeenCalledWith(404);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Igreja nao encontrada" }),
      );
    });

    it("responde 404 quando a igreja esta inativa", async () => {
      mockPrismaClient.crunch.findUnique.mockResolvedValue({ ...churchRow, isActive: false });
      const reply = makeReply();

      await adapters.getChurch(makeRequest({ slug: "igreja-central" }), reply);

      expect(reply.code).toHaveBeenCalledWith(404);
    });

    it("rejeita quando slug nao informado", async () => {
      await expect(adapters.getChurch(makeRequest({}), makeReply())).rejects.toThrow(
        "Igreja nao informada",
      );
    });

    it("monta a pagina publica com conteudo, horarios e rodape", async () => {
      mockPrismaClient.crunch.findUnique.mockResolvedValue(churchRow);
      const reply = makeReply();

      const result = await adapters.getChurch(makeRequest({ slug: "igreja-central" }), reply);

      expect(result).toEqual(
        expect.objectContaining({
          church: churchRow,
          serviceTimes: [],
          publicContent: [],
          publicVerses: [],
          publicDevotionals: [],
          publicPosts: [],
          footer: expect.objectContaining({
            address: expect.objectContaining({ city: "Sao Paulo" }),
            contacts: expect.objectContaining({ email: "contato@igreja.com" }),
            social: { instagram: "@igreja" },
          }),
        }),
      );
      expect(result.upcomingServices).toEqual({ week: [], month: [] });
    });
  });

  describe("getServiceTimes", () => {
    it("responde 404 quando a igreja nao existe", async () => {
      mockPrismaClient.crunch.findUnique.mockResolvedValue(null);
      const reply = makeReply();

      await adapters.getServiceTimes(makeRequest({ slug: "nao-existe" }), reply);

      expect(reply.code).toHaveBeenCalledWith(404);
    });

    it("devolve os horarios de culto e as proximas ocorrencias", async () => {
      mockPrismaClient.crunch.findUnique.mockResolvedValue(churchRow);
      const reply = makeReply();

      const result = await adapters.getServiceTimes(makeRequest({ slug: "igreja-central" }), reply);

      expect(result).toEqual({ serviceTimes: [], upcomingServices: { week: [], month: [] } });
    });
  });

  describe("subscribe", () => {
    it("responde 404 quando a igreja nao existe", async () => {
      mockPrismaClient.crunch.findUnique.mockResolvedValue(null);
      const reply = makeReply();

      await adapters.subscribe(
        makeRequest({ slug: "nao-existe" }, { endpoint: "https://x", keys: { p256dh: "a", auth: "b" } }),
        reply,
      );

      expect(reply.code).toHaveBeenCalledWith(404);
    });

    it("rejeita sem endpoint", async () => {
      mockPrismaClient.crunch.findUnique.mockResolvedValue(churchRow);

      await expect(
        adapters.subscribe(makeRequest({ slug: "igreja-central" }, {}), makeReply()),
      ).rejects.toThrow("Endpoint da notificacao e obrigatorio");
    });

    it("inscreve um visitante anonimo (sem userId) na igreja", async () => {
      mockPrismaClient.crunch.findUnique.mockResolvedValue(churchRow);
      mockPrismaClient.pushSubscription.upsert.mockResolvedValue({ id: "sub-1", endpoint: "https://x" });

      const result = await adapters.subscribe(
        makeRequest({ slug: "igreja-central" }, { endpoint: "https://x", keys: { p256dh: "a", auth: "b" } }),
        makeReply(),
      );

      expect(result).toEqual({ id: "sub-1", endpoint: "https://x" });
      expect(mockPrismaClient.pushSubscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ crunchId: "church-1" }),
          update: expect.objectContaining({ userId: null, crunchId: "church-1" }),
        }),
      );
    });
  });

  describe("unsubscribe", () => {
    it("remove a inscricao anonima pelo endpoint e pela igreja", async () => {
      mockPrismaClient.crunch.findUnique.mockResolvedValue(churchRow);

      const result = await adapters.unsubscribe(
        makeRequest({ slug: "igreja-central" }, { endpoint: "https://x" }),
        makeReply(),
      );

      expect(result).toEqual({ success: true });
      expect(mockPrismaClient.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: { endpoint: "https://x", crunchId: "church-1", userId: null },
      });
    });
  });
});
