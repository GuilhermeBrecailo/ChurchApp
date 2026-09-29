import { HolyricsServiceClient } from "../src/infrastructure/holyrics/HolyricsServiceClient";

describe("HolyricsServiceClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "ok",
        response_status: "ok",
        response: {
          status: "ok",
          data: { version: "2.30.0", permissions: "SearchLyrics,AddLyricsToPlaylist" },
        },
      }),
    });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("envia api_key e token no relay oficial e interpreta o envelope", async () => {
    const result = await HolyricsServiceClient.getTokenInfo({
      apiKey: "api-key",
      token: "token",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.holyrics.com.br/request/GetTokenInfo",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          api_key: "api-key",
          token: "token",
        }),
      }),
    );
    expect(result.version).toBe("2.30.0");
  });
});
