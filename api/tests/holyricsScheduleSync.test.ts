const mockPrismaClient = {
  crunch: { findUnique: jest.fn() },
  schedule: { findFirst: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

const mockSearchLyrics = jest.fn();
const mockAddLyricsToPlaylist = jest.fn();
class MockHolyricsClientError extends Error {}
jest.mock("../src/infrastructure/holyrics/HolyricsServiceClient", () => ({
  HolyricsServiceClient: {
    searchLyrics: (...args: unknown[]) => mockSearchLyrics(...args),
    addLyricsToPlaylist: (...args: unknown[]) => mockAddLyricsToPlaylist(...args),
  },
  HolyricsClientError: MockHolyricsClientError,
}));

import { FastifyRequest } from "fastify";
import { HolyricsAdapters } from "../src/interfaces/adapters/holyricsAdapters";
import { DomainError } from "../src/domain/value-objects/utils/DomainError";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(role = "PASTOR"): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("user-1")}` },
    params: { id: "schedule-1" },
    churchContext: {
      activeChurchId: "church-1",
      role,
      canManageMembers: role === "PASTOR",
      roles: [],
      membershipId: "membership-1",
      hasFeature: () => true,
    },
  } as unknown as FastifyRequest;
}

const credentials = { apiKey: "api-key", token: "token" };

function scheduleWithSongs() {
  return {
    id: "schedule-1",
    departmentId: "department-1",
    department: { id: "department-1", leaderId: "leader-1" },
    mediaItems: [
      {
        order: 0,
        mediaItem: {
          id: "song-1",
          title: "A Luz",
          category: "MUSIC",
          metadata: { artist: "Banda A" },
        },
      },
      {
        order: 1,
        mediaItem: {
          id: "resource-1",
          title: "Avisos",
          category: "RESOURCE",
          metadata: null,
        },
      },
      {
        order: 2,
        mediaItem: {
          id: "song-2",
          title: "Caminho",
          category: "MUSIC",
          metadata: { artist: "Banda B" },
        },
      },
    ],
  };
}

describe("HolyricsAdapters - sincronização de escala", () => {
  let adapters: HolyricsAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new HolyricsAdapters();
    mockPrismaClient.crunch.findUnique.mockResolvedValue({
      holyricsApiKey: credentials.apiKey,
      holyricsToken: credentials.token,
    });
    mockPrismaClient.schedule.findFirst.mockResolvedValue(scheduleWithSongs());
  });

  it("busca somente músicas, preserva a ordem e adiciona os IDs encontrados", async () => {
    mockSearchLyrics
      .mockResolvedValueOnce([{ id: "holyrics-1", title: "A Luz", artist: "Banda A" }])
      .mockResolvedValueOnce([{ id: "holyrics-2", title: "Caminho", artist: "Banda B" }]);

    const result = await adapters.syncSchedule(makeRequest());

    expect(mockSearchLyrics.mock.calls.map((call) => call[1])).toEqual([
      "A Luz",
      "Caminho",
    ]);
    expect(mockAddLyricsToPlaylist).toHaveBeenCalledWith(credentials, [
      "holyrics-1",
      "holyrics-2",
    ]);
    expect(result).toEqual({
      target: "current_playlist",
      added: [
        { mediaItemId: "song-1", title: "A Luz", artist: "Banda A", holyricsId: "holyrics-1" },
        { mediaItemId: "song-2", title: "Caminho", artist: "Banda B", holyricsId: "holyrics-2" },
      ],
      notFound: [],
    });
  });

  it("retorna músicas não encontradas sem interromper os matches", async () => {
    mockSearchLyrics
      .mockResolvedValueOnce([{ id: "holyrics-1", title: "A Luz", artist: "Banda A" }])
      .mockResolvedValueOnce([]);

    const result = await adapters.syncSchedule(makeRequest());

    expect(mockAddLyricsToPlaylist).toHaveBeenCalledWith(credentials, ["holyrics-1"]);
    expect(result.notFound).toEqual([
      expect.objectContaining({
        mediaItemId: "song-2",
        title: "Caminho",
        artist: "Banda B",
        reason: "not_found",
      }),
    ]);
  });

  it("não escolhe silenciosamente um resultado ambíguo", async () => {
    mockSearchLyrics
      .mockResolvedValueOnce([
        { id: "holyrics-1", title: "A Luz", artist: "Banda A" },
        { id: "holyrics-2", title: "A Luz", artist: "Banda A" },
      ])
      .mockResolvedValueOnce([]);

    const result = await adapters.syncSchedule(makeRequest());

    expect(mockAddLyricsToPlaylist).not.toHaveBeenCalled();
    expect(result.notFound[0]).toEqual(
      expect.objectContaining({ mediaItemId: "song-1", reason: "ambiguous" }),
    );
  });

  it("recusa sincronização sem conexão configurada", async () => {
    mockPrismaClient.crunch.findUnique.mockResolvedValue({
      holyricsApiKey: null,
      holyricsToken: null,
    });

    await expect(adapters.syncSchedule(makeRequest())).rejects.toThrow(DomainError);
    expect(mockSearchLyrics).not.toHaveBeenCalled();
    expect(mockAddLyricsToPlaylist).not.toHaveBeenCalled();
  });

  it("transforma falha ao adicionar na playlist em erro de domínio", async () => {
    mockSearchLyrics
      .mockResolvedValueOnce([{ id: "holyrics-1", title: "A Luz", artist: "Banda A" }])
      .mockResolvedValueOnce([{ id: "holyrics-2", title: "Caminho", artist: "Banda B" }]);
    mockAddLyricsToPlaylist.mockRejectedValue(new Error("Holyrics offline"));

    await expect(adapters.syncSchedule(makeRequest())).rejects.toThrow(DomainError);
  });
});
