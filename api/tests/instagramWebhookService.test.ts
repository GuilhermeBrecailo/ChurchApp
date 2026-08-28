const mockPrismaClient = {
  instagramWebhookEvent: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  commercialLead: {
    findFirst: jest.fn(),
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

import {
  InstagramWebhookService,
  normalizeInstagramWebhookPayload,
} from "../src/infrastructure/instagram/InstagramWebhookService";

describe("InstagramWebhookService", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockPrismaClient.$transaction.mockImplementation(
      async (callback: (transaction: typeof mockPrismaClient) => unknown) =>
        callback(mockPrismaClient),
    );
  });

  it("normalizes Instagram messages without retaining the raw webhook payload", () => {
    const events = normalizeInstagramWebhookPayload({
      object: "instagram",
      entry: [
        {
          id: "business-1",
          messaging: [
            {
              sender: { id: "person-1" },
              timestamp: 1_700_000_000_000,
              message: { mid: "mid-1", text: "Olá, quero conhecer" },
            },
          ],
        },
      ],
    });

    expect(events).toEqual([
      {
        eventId: "message:business-1:mid-1",
        instagramUserId: "business-1",
        senderId: "person-1",
        eventType: "MESSAGE",
        messageText: "Olá, quero conhecer",
        occurredAt: new Date("2023-11-14T22:13:20.000Z"),
        metadata: {},
      },
    ]);
  });

  it("creates a customer lead and records an inbound message once", async () => {
    mockPrismaClient.instagramWebhookEvent.findUnique.mockResolvedValue(null);
    mockPrismaClient.commercialLead.findFirst.mockResolvedValue(null);
    mockPrismaClient.commercialLead.create.mockResolvedValue({ id: "lead-1" });

    const service = new InstagramWebhookService(mockPrismaClient as never);
    const result = await service.process({
      object: "instagram",
      entry: [
        {
          id: "business-1",
          messaging: [
            {
              sender: { id: "person-1" },
              message: { mid: "mid-1", text: "Oi" },
            },
          ],
        },
      ],
    });

    expect(result).toEqual({ eventCount: 1, stored: 1, duplicates: 0, leadsUpdated: 1 });
    expect(mockPrismaClient.commercialLead.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        funnel: "CUSTOMER",
        stage: "CONVERSATION_ACTIVE",
        instagramUserId: "person-1",
        source: "instagram_webhook",
      }),
    });
    expect(mockPrismaClient.commercialLeadEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: "lead-1",
        type: "INBOUND_MESSAGE",
        channel: "INSTAGRAM",
      }),
    });
    expect(mockPrismaClient.instagramWebhookEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventId: "message:business-1:mid-1",
        senderId: "person-1",
        leadId: "lead-1",
        messageText: "Oi",
      }),
    });
  });

  it("deduplicates a redelivered Instagram message by its message ID", async () => {
    mockPrismaClient.instagramWebhookEvent.findUnique.mockResolvedValue({ id: "event-1" });

    const service = new InstagramWebhookService(mockPrismaClient as never);
    const result = await service.process({
      object: "instagram",
      entry: [
        {
          id: "business-1",
          messaging: [{ sender: { id: "person-1" }, message: { mid: "mid-1" } }],
        },
      ],
    });

    expect(result).toEqual({ eventCount: 1, stored: 0, duplicates: 1, leadsUpdated: 0 });
    expect(mockPrismaClient.instagramWebhookEvent.create).not.toHaveBeenCalled();
    expect(mockPrismaClient.commercialLead.create).not.toHaveBeenCalled();
  });

  it("promotes an existing awaiting lead when a message arrives", async () => {
    mockPrismaClient.instagramWebhookEvent.findUnique.mockResolvedValue(null);
    mockPrismaClient.commercialLead.findFirst.mockResolvedValue({
      id: "lead-1",
      funnel: "CUSTOMER",
      stage: "AWAITING_REPLY",
      doNotContact: false,
    });

    const service = new InstagramWebhookService(mockPrismaClient as never);
    const result = await service.process({
      object: "instagram",
      entry: [
        {
          id: "business-1",
          messaging: [{ sender: { id: "person-1" }, message: { mid: "mid-2" } }],
        },
      ],
    });

    expect(result.leadsUpdated).toBe(1);
    expect(mockPrismaClient.commercialLead.update).toHaveBeenCalledWith({
      where: { id: "lead-1" },
      data: { stage: "CONVERSATION_ACTIVE" },
    });
    expect(mockPrismaClient.commercialLeadEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fromStage: "AWAITING_REPLY",
        toStage: "CONVERSATION_ACTIVE",
      }),
    });
  });

  it("records opted-out lead messages without changing their stage", async () => {
    mockPrismaClient.instagramWebhookEvent.findUnique.mockResolvedValue(null);
    mockPrismaClient.commercialLead.findFirst.mockResolvedValue({
      id: "lead-1",
      funnel: "CUSTOMER",
      stage: "DO_NOT_CONTACT",
      doNotContact: true,
    });

    const service = new InstagramWebhookService(mockPrismaClient as never);
    const result = await service.process({
      object: "instagram",
      entry: [
        {
          id: "business-1",
          messaging: [{ sender: { id: "person-1" }, message: { mid: "mid-3" } }],
        },
      ],
    });

    expect(result).toEqual({ eventCount: 1, stored: 1, duplicates: 0, leadsUpdated: 0 });
    expect(mockPrismaClient.commercialLead.update).toHaveBeenCalledWith({
      where: { id: "lead-1" },
      data: {},
    });
    expect(mockPrismaClient.commercialLeadEvent.create).not.toHaveBeenCalled();
  });
});
