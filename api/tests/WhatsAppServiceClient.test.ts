import { WhatsAppServiceClient } from "../src/infrastructure/whatsapp/WhatsAppServiceClient";

describe("WhatsAppServiceClient - phone number normalization", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ exists: true }),
    });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  function bodySentToGateway() {
    const call = (global.fetch as jest.Mock).mock.calls[0];
    return JSON.parse(call[1].body);
  }

  it("adds the 55 country code to an 11-digit local number (DDD + 9-digit mobile)", async () => {
    await WhatsAppServiceClient.checkNumberExists("church-1", "41999999999");
    expect(bodySentToGateway().number).toBe("5541999999999");
  });

  it("adds the 55 country code to a 10-digit local number (DDD + 8-digit landline)", async () => {
    await WhatsAppServiceClient.checkNumberExists("church-1", "4133334444");
    expect(bodySentToGateway().number).toBe("554133334444");
  });

  it("strips formatting characters before normalizing", async () => {
    await WhatsAppServiceClient.checkNumberExists("church-1", "(41) 99999-9999");
    expect(bodySentToGateway().number).toBe("5541999999999");
  });

  it("leaves a number that already has the 55 country code unchanged", async () => {
    await WhatsAppServiceClient.checkNumberExists("church-1", "5541999999999");
    expect(bodySentToGateway().number).toBe("5541999999999");
  });

  it("normalizes the number passed to sendText the same way", async () => {
    await WhatsAppServiceClient.sendText("church-1", "41999999999", "oi");
    expect(bodySentToGateway().number).toBe("5541999999999");
  });
});
