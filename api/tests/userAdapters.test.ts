const mockPrismaClient = {
  user: { findUnique: jest.fn(), update: jest.fn() },
  crunch: { update: jest.fn() },
  churchMembership: { findMany: jest.fn().mockResolvedValue([]) },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

jest.mock("../src/infrastructure/identity/KeycloakProvider", () => ({
  KeycloakProvider: jest.fn().mockImplementation(() => ({})),
}));

const mockMkdir = jest.fn().mockResolvedValue(undefined);
const mockWriteFile = jest.fn().mockResolvedValue(undefined);

jest.mock("node:fs/promises", () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}));

import { FastifyRequest } from "fastify";
import { UserAdapters } from "../src/interfaces/adapters/userAdapters";
import { DomainError } from "../src/domain/value-objects/utils/DomainError";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(options: {
  hasFeature: boolean;
  body: Record<string, unknown>;
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
    params: {},
    body: options.body,
  } as unknown as FastifyRequest;
}

describe("UserAdapters.updateOwnChurch plan gate", () => {
  let adapters: UserAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new UserAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "pastor-1",
      crunchId: "church-1",
      crunch: { id: "church-1" },
    });
  });

  it("blocks accentColor change on a FREE church", async () => {
    const request = makeRequest({ hasFeature: false, body: { accentColor: "#FF0000" } });

    await expect(adapters.updateOwnChurch(request)).rejects.toThrow(DomainError);
    expect(mockPrismaClient.crunch.update).not.toHaveBeenCalled();
  });

  it("blocks fontFamily change on a FREE church", async () => {
    const request = makeRequest({ hasFeature: false, body: { fontFamily: "MODERNA" } });

    await expect(adapters.updateOwnChurch(request)).rejects.toThrow(DomainError);
  });

  it("allows basic fields (name) on a FREE church", async () => {
    mockPrismaClient.crunch.update.mockResolvedValue({ id: "church-1", name: "Nova Igreja" });
    const request = makeRequest({ hasFeature: false, body: { name: "Nova Igreja" } });

    await adapters.updateOwnChurch(request);

    expect(mockPrismaClient.crunch.update).toHaveBeenCalled();
  });

  it("allows appearance fields on a PRO church", async () => {
    mockPrismaClient.crunch.update.mockResolvedValue({ id: "church-1", accentColor: "#FF0000" });
    const request = makeRequest({ hasFeature: true, body: { accentColor: "#FF0000" } });

    await adapters.updateOwnChurch(request);

    expect(mockPrismaClient.crunch.update).toHaveBeenCalled();
  });
});

function makeCrunch(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "church-1",
    name: "Igreja Central",
    slug: "igreja-central",
    city: "Maringá",
    road: "Rua A",
    number: null,
    localZipCode: "87000-000",
    state: "PR",
    complement: null,
    document: null,
    logo: null,
    accentColor: null,
    textColor: null,
    fontFamily: null,
    isActive: true,
    userMainId: "pastor-1",
    phone: null,
    whatsapp: null,
    email: null,
    instagram: null,
    facebook: null,
    youtube: null,
    website: null,
    plan: "FREE",
    subscriptionStatus: "TRIALING",
    trialEndsAt: null,
    ...overrides,
  };
}

function makeMeRequest(): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("pastor-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role: "PASTOR",
      canManageMembers: true,
      roles: [],
      membershipId: "membership-1",
      hasFeature: () => false,
    },
    params: {},
    body: {},
  } as unknown as FastifyRequest;
}

describe("UserAdapters.getMe exposes plan features", () => {
  let adapters: UserAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new UserAdapters();
  });

  it("returns an empty features list for a FREE church", async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "pastor-1",
      name: "Pastor Teste",
      email: "pastor@teste.com",
      phone: null,
      mustChangePassword: false,
      isDemoUser: false,
      crunch: makeCrunch({ plan: "FREE" }),
      churchMemberships: [],
    });

    const result = await adapters.getMe(makeMeRequest());

    expect(result.church?.plan).toBe("FREE");
    expect(result.church?.features).toEqual([]);
  });

  it("returns the full Pro feature list for an active PRO church", async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "pastor-1",
      name: "Pastor Teste",
      email: "pastor@teste.com",
      phone: null,
      mustChangePassword: false,
      isDemoUser: false,
      crunch: makeCrunch({ plan: "PRO", subscriptionStatus: "ACTIVE" }),
      churchMemberships: [],
    });

    const result = await adapters.getMe(makeMeRequest());

    expect(result.church?.plan).toBe("PRO");
    expect(result.church?.features).toContain("REPORTS");
    expect(result.church?.features).toContain("CUSTOM_ROLES");
  });
});

function makeUploadRequest(
  file: { filename: string; mimetype: string; toBuffer: () => Promise<Buffer> } | undefined,
): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("pastor-1")}`, host: "localhost:8000" },
    file: async () => file,
  } as unknown as FastifyRequest;
}

describe("UserAdapters.uploadMyAvatar", () => {
  let adapters: UserAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new UserAdapters();
    mockPrismaClient.user.update.mockResolvedValue({ id: "pastor-1" });
  });

  it("rejects when no file is sent", async () => {
    await expect(adapters.uploadMyAvatar(makeUploadRequest(undefined))).rejects.toThrow(
      DomainError,
    );
  });

  it("rejects an invalid mimetype", async () => {
    await expect(
      adapters.uploadMyAvatar(
        makeUploadRequest({
          filename: "malware.exe",
          mimetype: "application/octet-stream",
          toBuffer: async () => Buffer.from("x"),
        }),
      ),
    ).rejects.toThrow(DomainError);
  });

  it("rejects a file over 5MB", async () => {
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024);

    await expect(
      adapters.uploadMyAvatar(
        makeUploadRequest({
          filename: "big.png",
          mimetype: "image/png",
          toBuffer: async () => bigBuffer,
        }),
      ),
    ).rejects.toThrow(DomainError);
  });

  it("saves the file, updates avatarUrl and returns the upload metadata", async () => {
    const buffer = Buffer.from("conteudo da imagem");

    const result = await adapters.uploadMyAvatar(
      makeUploadRequest({
        filename: "eu.png",
        mimetype: "image/png",
        toBuffer: async () => buffer,
      }),
    );

    expect(mockMkdir).toHaveBeenCalled();
    expect(mockWriteFile).toHaveBeenCalled();
    expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
      where: { id: "pastor-1" },
      data: { avatarUrl: expect.stringContaining("/uploads/user/pastor-1/avatar/") },
    });
    expect(result.url).toContain("/uploads/user/pastor-1/avatar/");
    expect(result.mimeType).toBe("image/png");
    expect(result.size).toBe(buffer.byteLength);
  });
});
