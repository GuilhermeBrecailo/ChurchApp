const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  crunch: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
  commercialLead: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  commercialLeadEvent: { create: jest.fn() },
  $transaction: jest.fn(),
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

jest.mock("../src/infrastructure/identity/KeycloakProvider", () => ({
  KeycloakProvider: jest.fn().mockImplementation(() => ({})),
}));

import { FastifyRequest } from "fastify";
import { AdminAdapters } from "../src/interfaces/adapters/adminAdapters";
import { DomainError } from "../src/domain/value-objects/utils/DomainError";

function fakeAdminToken(overrides: Record<string, unknown> = {}) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ sub: "admin-1", is_admin: true, ...overrides }),
  ).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(options: {
  token?: string;
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${options.token ?? fakeAdminToken()}` },
    params: options.params ?? {},
    body: options.body ?? {},
    query: options.query ?? {},
  } as unknown as FastifyRequest;
}

describe("AdminAdapters.setChurchPlan", () => {
  let adapters: AdminAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new AdminAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({ id: "admin-1", role: "SUPER_ADMIN" });
  });

  it("rejects a non-admin caller", async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({ id: "user-1", role: "PASTOR" });
    const request = makeRequest({
      token: fakeAdminToken({ sub: "user-1", is_admin: false }),
      params: { id: "church-1" },
      body: { plan: "ILIMITADO" },
    });

    await expect(adapters.setChurchPlan(request)).rejects.toThrow(DomainError);
  });

  it("rejects an invalid plan value", async () => {
    const request = makeRequest({ params: { id: "church-1" }, body: { plan: "GOLD" } });

    await expect(adapters.setChurchPlan(request)).rejects.toThrow(DomainError);
  });

  it("rejects when neither plan nor trialEndsAt is provided", async () => {
    const request = makeRequest({ params: { id: "church-1" }, body: {} });

    await expect(adapters.setChurchPlan(request)).rejects.toThrow(DomainError);
  });

  it("rejects an invalid trialEndsAt date string", async () => {
    const request = makeRequest({
      params: { id: "church-1" },
      body: { trialEndsAt: "not-a-date" },
    });

    await expect(adapters.setChurchPlan(request)).rejects.toThrow(DomainError);
  });

  it("rejects when the church does not exist", async () => {
    mockPrismaClient.crunch.findUnique.mockResolvedValue(null);
    const request = makeRequest({ params: { id: "church-404" }, body: { plan: "ILIMITADO" } });

    await expect(adapters.setChurchPlan(request)).rejects.toThrow(DomainError);
  });

  it("updates the church plan to ILIMITADO", async () => {
    mockPrismaClient.crunch.findUnique.mockResolvedValue({ id: "church-1" });
    mockPrismaClient.crunch.update.mockResolvedValue({
      id: "church-1",
      name: "Igreja Central",
      plan: "ILIMITADO",
      subscriptionStatus: "TRIALING",
      trialEndsAt: null,
    });
    const request = makeRequest({ params: { id: "church-1" }, body: { plan: "ILIMITADO" } });

    const result = await adapters.setChurchPlan(request);

    expect(mockPrismaClient.crunch.update).toHaveBeenCalledWith({
      where: { id: "church-1" },
      data: { plan: "ILIMITADO" },
      select: {
        id: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
      },
    });
    expect(result.plan).toBe("ILIMITADO");
  });

  it("extends the trial end date without changing the plan", async () => {
    mockPrismaClient.crunch.findUnique.mockResolvedValue({ id: "church-1" });
    mockPrismaClient.crunch.update.mockResolvedValue({
      id: "church-1",
      name: "Igreja Central",
      plan: "PRO",
      subscriptionStatus: "TRIALING",
      trialEndsAt: new Date("2027-01-01T00:00:00.000Z"),
    });
    const request = makeRequest({
      params: { id: "church-1" },
      body: { trialEndsAt: "2027-01-01T00:00:00.000Z" },
    });

    await adapters.setChurchPlan(request);

    expect(mockPrismaClient.crunch.update).toHaveBeenCalledWith({
      where: { id: "church-1" },
      data: { trialEndsAt: new Date("2027-01-01T00:00:00.000Z"), trialReminderSentAt: null },
      select: {
        id: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
      },
    });
  });

  it("updates plan and trialEndsAt together", async () => {
    mockPrismaClient.crunch.findUnique.mockResolvedValue({ id: "church-1" });
    mockPrismaClient.crunch.update.mockResolvedValue({
      id: "church-1",
      name: "Igreja Central",
      plan: "PRO",
      subscriptionStatus: "TRIALING",
      trialEndsAt: new Date("2027-01-01T00:00:00.000Z"),
    });
    const request = makeRequest({
      params: { id: "church-1" },
      body: { plan: "PRO", trialEndsAt: "2027-01-01T00:00:00.000Z" },
    });

    await adapters.setChurchPlan(request);

    expect(mockPrismaClient.crunch.update).toHaveBeenCalledWith({
      where: { id: "church-1" },
      data: {
        plan: "PRO",
        trialEndsAt: new Date("2027-01-01T00:00:00.000Z"),
        trialReminderSentAt: null,
      },
      select: {
        id: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
      },
    });
  });
});

describe("AdminAdapters.getChurches plan fields", () => {
  let adapters: AdminAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new AdminAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({ id: "admin-1", role: "SUPER_ADMIN" });
  });

  it("includes plan, subscriptionStatus and trialEndsAt in the church list", async () => {
    mockPrismaClient.crunch.findMany.mockResolvedValue([
      {
        id: "church-1",
        name: "Igreja Central",
        city: "Maringá",
        state: "PR",
        document: null,
        logo: null,
        isActive: true,
        createdAt: new Date("2026-01-01"),
        userMainId: "user-1",
        plan: "PRO",
        subscriptionStatus: "TRIALING",
        trialEndsAt: new Date("2026-04-01"),
        _count: { users: 1, departments: 0, pastorHistory: 1 },
      },
    ]);

    const request = makeRequest({});
    const [church] = await adapters.getChurches(request);

    expect(church.plan).toBe("PRO");
    expect(church.subscriptionStatus).toBe("TRIALING");
    expect(church.trialEndsAt).toEqual(new Date("2026-04-01"));
  });
});

describe("AdminAdapters commercial leads", () => {
  let adapters: AdminAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new AdminAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({ id: "admin-1", role: "SUPER_ADMIN" });
    mockPrismaClient.$transaction.mockImplementation(
      async (callback: (transaction: typeof mockPrismaClient) => unknown) =>
        callback(mockPrismaClient),
    );
  });

  it("lists leads only for a platform administrator", async () => {
    const items = [{ id: "lead-1", funnel: "CUSTOMER", stage: "DISCOVERED" }];
    mockPrismaClient.commercialLead.findMany.mockResolvedValue(items);
    mockPrismaClient.commercialLead.count.mockResolvedValue(1);

    const result = await adapters.getCommercialLeads(
      makeRequest({
        query: {
          funnel: "CUSTOMER",
          stage: "DISCOVERED",
          includeDoNotContact: "false",
          limit: "25",
        },
      }),
    );

    expect(result).toEqual({ items, total: 1 });
    expect(mockPrismaClient.commercialLead.count).toHaveBeenCalledWith({
      where: { funnel: "CUSTOMER", stage: "DISCOVERED", doNotContact: false },
    });
  });

  it("returns a lead with its event history", async () => {
    const lead = { id: "lead-1", events: [{ id: "event-1", type: "DISCOVERED" }] };
    mockPrismaClient.commercialLead.findUnique.mockResolvedValue(lead);

    const result = await adapters.getCommercialLeadById(
      makeRequest({ params: { id: "lead-1" } }),
    );

    expect(result).toEqual(lead);
  });

  it("returns an attributed signup URL without exposing the raw token", async () => {
    mockPrismaClient.commercialLead.findUnique.mockResolvedValue({
      id: "lead-1",
      funnel: "CUSTOMER",
      stage: "QUALIFIED",
      signupToken: "550e8400-e29b-41d4-a716-446655440000",
      events: [],
    });

    const result = await adapters.getCommercialLeadById(
      makeRequest({ params: { id: "lead-1" } }),
    );

    expect(result).toEqual({
      id: "lead-1",
      funnel: "CUSTOMER",
      stage: "QUALIFIED",
      events: [],
      signupUrl:
        "https://churchapp.site/register?lead=550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result).not.toHaveProperty("signupToken");
  });

  it("creates a reviewed lead and records it in the commercial funnel", async () => {
    const lead = {
      id: "lead-1",
      funnel: "CUSTOMER",
      stage: "DISCOVERED",
      organizationName: "Igreja Central",
      publicProfileUrl: "https://maps.google.com/?cid=123",
    };
    mockPrismaClient.commercialLead.findFirst.mockResolvedValue(null);
    mockPrismaClient.commercialLead.create.mockResolvedValue(lead);
    mockPrismaClient.commercialLeadEvent.create.mockResolvedValue({ id: "event-1" });

    const result = await adapters.createCommercialLead(
      makeRequest({
        body: {
          funnel: "CUSTOMER",
          organizationName: "Igreja Central",
          publicProfileUrl: "https://maps.google.com/?cid=123",
          source: "google_places_reviewed",
        },
      }),
    );

    expect(result).toEqual({ lead, created: true });
    expect(mockPrismaClient.commercialLead.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        funnel: "CUSTOMER",
        stage: "DISCOVERED",
        organizationName: "Igreja Central",
        publicProfileUrl: "https://maps.google.com/?cid=123",
        source: "google_places_reviewed",
      }),
    });
  });

  it("rejects a reviewed lead without a public identity", async () => {
    await expect(
      adapters.createCommercialLead(
        makeRequest({ body: { funnel: "CUSTOMER", organizationName: "Igreja Central" } }),
      ),
    ).rejects.toThrow(DomainError);
  });

  it("changes a lead stage through the validated pipeline", async () => {
    mockPrismaClient.commercialLead.findUnique.mockResolvedValue({
      id: "lead-1",
      funnel: "CUSTOMER",
      stage: "DISCOVERED",
    });
    mockPrismaClient.commercialLead.update.mockResolvedValue({
      id: "lead-1",
      funnel: "CUSTOMER",
      stage: "QUALIFIED",
    });
    mockPrismaClient.commercialLeadEvent.create.mockResolvedValue({ id: "event-1" });

    const result = await adapters.updateCommercialLeadStage(
      makeRequest({ params: { id: "lead-1" }, body: { stage: "QUALIFIED" } }),
    );

    expect(result.stage).toBe("QUALIFIED");
  });
});
