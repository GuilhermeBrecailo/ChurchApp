import { InstagramIntegrationError } from "../src/infrastructure/instagram/InstagramBusinessLoginService";
import { InstagramMessagingService } from "../src/infrastructure/instagram/InstagramMessagingService";

function mockResponse(data: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 400,
    json: jest.fn().mockResolvedValue(data),
  } as unknown as Response;
}

describe("InstagramMessagingService", () => {
  it("sends a text message through the Instagram Login endpoint", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      mockResponse({
        recipient_id: "person-1",
        message_id: "message-1",
      }),
    );
    const service = new InstagramMessagingService({
      fetcher: fetchMock as unknown as typeof fetch,
      graphApiVersion: "v26.0",
    });

    const result = await service.sendText({
      accessToken: "secret-token",
      instagramUserId: "business-1",
      recipientId: "person-1",
      text: "Olá, como posso ajudar?",
    });

    expect(result).toEqual({
      recipientId: "person-1",
      messageId: "message-1",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://graph.instagram.com/v26.0/business-1/messages",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer secret-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: { id: "person-1" },
          message: { text: "Olá, como posso ajudar?" },
        }),
      },
    );
  });

  it("does not expose Meta errors when the provider rejects the message", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      mockResponse({ error: { message: "Provider detail" } }, false),
    );
    const service = new InstagramMessagingService({
      fetcher: fetchMock as unknown as typeof fetch,
    });

    await expect(
      service.sendText({
        accessToken: "secret-token",
        instagramUserId: "business-1",
        recipientId: "person-1",
        text: "Olá",
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<InstagramIntegrationError>>({
        name: "InstagramIntegrationError",
      }),
    );
  });

  it("rejects an empty message before making a network request", async () => {
    const fetchMock = jest.fn();
    const service = new InstagramMessagingService({
      fetcher: fetchMock as unknown as typeof fetch,
    });

    await expect(
      service.sendText({
        accessToken: "secret-token",
        instagramUserId: "business-1",
        recipientId: "person-1",
        text: "   ",
      }),
    ).rejects.toThrow("Mensagem do Instagram inválida");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
