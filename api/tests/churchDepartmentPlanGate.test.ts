const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  department: { findFirst: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

jest.mock("../src/infrastructure/notifications/PushNotificationService", () => ({
  pushNotificationService: {
    sendToUsers: jest.fn(),
    sendPublicChurchContent: jest.fn(),
  },
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
  hasFeature: boolean;
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("pastor-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role: "PASTOR",
      canManageMembers: true,
      roles: [],
      membershipId: "membership-1",
      hasFeature: () => options.hasFeature,
    },
    params: options.params ?? {},
    body: options.body ?? {},
    query: {},
  } as unknown as FastifyRequest;
}

describe("ChurchDepartmentAdapters plan gate", () => {
  let adapters: ChurchDepartmentAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new ChurchDepartmentAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "pastor-1",
      crunchId: "church-1",
      role: "PASTOR",
    });
  });

  it("blocks createChurchDepartmentResource on a FREE church", async () => {
    const request = makeRequest({
      hasFeature: false,
      params: { id: "dept-1" },
      body: { title: "Cifra", url: "https://example.com" },
    });

    await expect(adapters.createChurchDepartmentResource(request)).rejects.toThrow(DomainError);
  });

  it("blocks sendChurchScheduleReminder on a FREE church", async () => {
    const request = makeRequest({ hasFeature: false, params: { id: "schedule-1" } });

    await expect(adapters.sendChurchScheduleReminder(request)).rejects.toThrow(DomainError);
  });

  it("blocks importCifraClubSong on a FREE church", async () => {
    const request = makeRequest({
      hasFeature: false,
      params: { id: "dept-1" },
      body: { url: "https://www.cifraclub.com.br/artista/musica" },
    });

    await expect(adapters.importCifraClubSong(request)).rejects.toThrow(DomainError);
  });

  it("blocks previewSongsFromPdf on a FREE church", async () => {
    const request = makeRequest({ hasFeature: false, params: { id: "dept-1" } });

    await expect(adapters.previewSongsFromPdf(request)).rejects.toThrow(DomainError);
  });

  it("blocks importSongsFromPdf on a FREE church", async () => {
    const request = makeRequest({ hasFeature: false, params: { id: "dept-1" }, body: { songs: [] } });

    await expect(adapters.importSongsFromPdf(request)).rejects.toThrow(DomainError);
  });

  it("blocks uploadChurchDepartmentPdf on a FREE church", async () => {
    const request = makeRequest({ hasFeature: false, params: { id: "dept-1" } });

    await expect(adapters.uploadChurchDepartmentPdf(request)).rejects.toThrow(DomainError);
  });
});
