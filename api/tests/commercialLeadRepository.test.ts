const mockPrismaClient = {
  commercialLead: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  commercialLeadEvent: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import { CommercialLeadRepository } from "../src/interfaces/adapters/commercialLeadRepository";

const discoveredLead = {
  id: "lead-1",
  funnel: "CUSTOMER",
  stage: "DISCOVERED",
  instagramHandle: "igreja.exemplo",
  instagramUserId: null,
  publicProfileUrl: "https://instagram.com/igreja.exemplo",
  doNotContact: false,
};

describe("CommercialLeadRepository", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockPrismaClient.$transaction.mockImplementation(
      async (callback: (transaction: typeof mockPrismaClient) => unknown) =>
        callback(mockPrismaClient),
    );
  });

  it("normalizes a discovered Instagram handle and records its discovery event", async () => {
    mockPrismaClient.commercialLead.findFirst.mockResolvedValue(null);
    mockPrismaClient.commercialLead.create.mockResolvedValue(discoveredLead);
    mockPrismaClient.commercialLeadEvent.create.mockResolvedValue({ id: "event-1" });

    const repository = new CommercialLeadRepository(mockPrismaClient as never);
    const result = await repository.findOrCreate({
      funnel: "CUSTOMER",
      instagramHandle: "@Igreja.Exemplo",
      publicProfileUrl: "https://instagram.com/igreja.exemplo",
      source: "instagram_public_profile",
      score: 72,
    });

    expect(result).toEqual({ lead: discoveredLead, created: true });
    expect(mockPrismaClient.commercialLead.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        funnel: "CUSTOMER",
        stage: "DISCOVERED",
        instagramHandle: "igreja.exemplo",
        source: "instagram_public_profile",
        score: 72,
      }),
    });
    expect(mockPrismaClient.commercialLeadEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: "lead-1",
        type: "DISCOVERED",
        toStage: "DISCOVERED",
      }),
    });
  });

  it("reuses an existing lead and never creates a duplicate", async () => {
    mockPrismaClient.commercialLead.findFirst.mockResolvedValue(discoveredLead);

    const repository = new CommercialLeadRepository(mockPrismaClient as never);
    const result = await repository.findOrCreate({
      funnel: "CUSTOMER",
      instagramHandle: "igreja.exemplo",
    });

    expect(result).toEqual({ lead: discoveredLead, created: false });
    expect(mockPrismaClient.commercialLead.create).not.toHaveBeenCalled();
    expect(mockPrismaClient.commercialLeadEvent.create).not.toHaveBeenCalled();
  });

  it("transitions a lead and records the previous and next stages", async () => {
    mockPrismaClient.commercialLead.findUnique.mockResolvedValue(discoveredLead);
    mockPrismaClient.commercialLead.update.mockResolvedValue({
      ...discoveredLead,
      stage: "QUALIFIED",
    });
    mockPrismaClient.commercialLeadEvent.create.mockResolvedValue({ id: "event-2" });

    const repository = new CommercialLeadRepository(mockPrismaClient as never);
    const result = await repository.transition("lead-1", "QUALIFIED");

    expect(result.stage).toBe("QUALIFIED");
    expect(mockPrismaClient.commercialLead.update).toHaveBeenCalledWith({
      where: { id: "lead-1" },
      data: { stage: "QUALIFIED", doNotContact: false },
    });
    expect(mockPrismaClient.commercialLeadEvent.create).toHaveBeenCalledWith({
      data: {
        leadId: "lead-1",
        type: "STAGE_CHANGED",
        fromStage: "DISCOVERED",
        toStage: "QUALIFIED",
      },
    });
  });

  it("makes opt-out permanent and rejects any later transition", async () => {
    mockPrismaClient.commercialLead.findUnique
      .mockResolvedValueOnce(discoveredLead)
      .mockResolvedValueOnce({
        ...discoveredLead,
        stage: "DO_NOT_CONTACT",
        doNotContact: true,
      });
    mockPrismaClient.commercialLead.update.mockResolvedValue({
      ...discoveredLead,
      stage: "DO_NOT_CONTACT",
      doNotContact: true,
    });
    mockPrismaClient.commercialLeadEvent.create.mockResolvedValue({ id: "event-3" });

    const repository = new CommercialLeadRepository(mockPrismaClient as never);

    await repository.transition("lead-1", "DO_NOT_CONTACT");

    await expect(repository.transition("lead-1", "PAUSED")).rejects.toThrow(
      "Transição inválida",
    );
    expect(mockPrismaClient.commercialLead.update).toHaveBeenCalledTimes(1);
  });

  it("lists commercial leads with operational filters and event counts", async () => {
    const leads = [
      {
        ...discoveredLead,
        _count: { events: 1 },
      },
    ];
    mockPrismaClient.commercialLead.findMany.mockResolvedValue(leads);
    mockPrismaClient.commercialLead.count.mockResolvedValue(1);

    const repository = new CommercialLeadRepository(mockPrismaClient as never);
    const result = await repository.list({
      funnel: "CUSTOMER",
      stage: "DISCOVERED",
      includeDoNotContact: false,
      limit: 25,
    });

    expect(result).toEqual({ items: leads, total: 1 });
    expect(mockPrismaClient.commercialLead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          funnel: "CUSTOMER",
          stage: "DISCOVERED",
          doNotContact: false,
        },
        take: 25,
      }),
    );
    expect(mockPrismaClient.commercialLead.count).toHaveBeenCalledWith({
      where: {
        funnel: "CUSTOMER",
        stage: "DISCOVERED",
        doNotContact: false,
      },
    });
  });

  it("loads a commercial lead with its chronological event history", async () => {
    const detail = {
      ...discoveredLead,
      events: [{ id: "event-1", type: "DISCOVERED" }],
      instagramWebhookEvents: [
        {
          id: "webhook-event-1",
          eventId: "message:business-1:mid-1",
          eventType: "MESSAGE",
          senderId: "person-1",
          messageText: "Oi",
          occurredAt: new Date("2026-08-28T12:00:00.000Z"),
          createdAt: new Date("2026-08-28T12:00:00.000Z"),
        },
      ],
    };
    mockPrismaClient.commercialLead.findUnique.mockResolvedValue(detail);

    const repository = new CommercialLeadRepository(mockPrismaClient as never);
    const result = await repository.findByIdWithEvents("lead-1");

    expect(result).toEqual(detail);
    expect(mockPrismaClient.commercialLead.findUnique).toHaveBeenCalledWith({
      where: { id: "lead-1" },
      include: {
        events: { orderBy: { createdAt: "asc" } },
        instagramWebhookEvents: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            eventId: true,
            eventType: true,
            senderId: true,
            messageText: true,
            occurredAt: true,
            createdAt: true,
          },
        },
      },
    });
  });

  it("marks a lead as signed up through its opaque attribution token", async () => {
    const tokenLead = {
      id: "lead-1",
      funnel: "CUSTOMER",
      stage: "DISCOVERED",
      doNotContact: false,
    };
    mockPrismaClient.commercialLead.findUnique
      .mockResolvedValueOnce(tokenLead)
      .mockResolvedValueOnce(tokenLead);
    mockPrismaClient.commercialLead.update.mockResolvedValue({
      ...tokenLead,
      stage: "SIGNED_UP",
    });
    mockPrismaClient.commercialLeadEvent.create.mockResolvedValue({ id: "event-4" });

    const repository = new CommercialLeadRepository(mockPrismaClient as never);
    const result = await repository.markStageBySignupToken(
      "550e8400-e29b-41d4-a716-446655440000",
      "SIGNED_UP",
    );

    expect(result?.stage).toBe("SIGNED_UP");
    expect(mockPrismaClient.commercialLead.findUnique).toHaveBeenNthCalledWith(1, {
      where: { signupToken: "550e8400-e29b-41d4-a716-446655440000" },
      select: { id: true, funnel: true, stage: true, doNotContact: true },
    });
  });

  it("does not move an opted-out lead through attribution", async () => {
    mockPrismaClient.commercialLead.findUnique.mockResolvedValue({
      id: "lead-1",
      funnel: "CUSTOMER",
      stage: "DO_NOT_CONTACT",
      doNotContact: true,
    });

    const repository = new CommercialLeadRepository(mockPrismaClient as never);
    const result = await repository.markStageBySignupToken(
      "550e8400-e29b-41d4-a716-446655440000",
      "SIGNED_UP",
    );

    expect(result).toBeNull();
    expect(mockPrismaClient.commercialLead.update).not.toHaveBeenCalled();
  });

  it("marks a signed-up lead as activated through its attribution token", async () => {
    const tokenLead = {
      id: "lead-1",
      funnel: "CUSTOMER",
      stage: "SIGNED_UP",
      doNotContact: false,
    };
    mockPrismaClient.commercialLead.findUnique.mockResolvedValue(tokenLead);
    mockPrismaClient.commercialLead.update.mockResolvedValue({
      ...tokenLead,
      stage: "ACTIVATED",
    });
    mockPrismaClient.commercialLeadEvent.create.mockResolvedValue({ id: "event-5" });

    const repository = new CommercialLeadRepository(mockPrismaClient as never);
    const result = await repository.markStageBySignupToken(
      "550e8400-e29b-41d4-a716-446655440000",
      "ACTIVATED",
    );

    expect(result?.stage).toBe("ACTIVATED");
    expect(mockPrismaClient.commercialLeadEvent.create).toHaveBeenCalledWith({
      data: {
        leadId: "lead-1",
        type: "STAGE_CHANGED",
        fromStage: "SIGNED_UP",
        toStage: "ACTIVATED",
      },
    });
  });
});
