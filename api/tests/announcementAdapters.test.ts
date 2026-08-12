const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  announcement: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
  crunch: { findUnique: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

const mockSendPublicChurchContent = jest.fn();

jest.mock("../src/infrastructure/notifications/PushNotificationService", () => ({
  pushNotificationService: {
    sendPublicChurchContent: (...args: unknown[]) => mockSendPublicChurchContent(...args),
  },
}));

import { FastifyRequest } from "fastify";
import { AnnouncementAdapters } from "../src/interfaces/adapters/announcementAdapters";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(hasFeature: boolean, body: Record<string, unknown>): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("pastor-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role: "PASTOR",
      canManageMembers: true,
      roles: [],
      membershipId: "membership-1",
      hasFeature: () => hasFeature,
    },
    params: {},
    body,
  } as unknown as FastifyRequest;
}

describe("AnnouncementAdapters mass notification gate", () => {
  let adapters: AnnouncementAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new AnnouncementAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "pastor-1",
      crunchId: "church-1",
      role: "PASTOR",
    });
    mockPrismaClient.announcement.create.mockResolvedValue({
      id: "ann-1",
      title: "Culto especial",
      body: "Venha participar",
      isPublic: true,
    });
    mockPrismaClient.crunch.findUnique.mockResolvedValue({ slug: "igreja-central" });
  });

  it("creates the announcement but skips the push on a FREE church", async () => {
    const result = await adapters.createAnnouncement(
      makeRequest(false, { title: "Culto especial", body: "Venha participar", isPublic: true }),
    );

    expect(result.id).toBe("ann-1");
    expect(mockPrismaClient.announcement.create).toHaveBeenCalled();
    expect(mockSendPublicChurchContent).not.toHaveBeenCalled();
  });

  it("creates the announcement and sends the push on a PRO church", async () => {
    await adapters.createAnnouncement(
      makeRequest(true, { title: "Culto especial", body: "Venha participar", isPublic: true }),
    );

    expect(mockSendPublicChurchContent).toHaveBeenCalled();
  });
});
