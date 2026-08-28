import {
  InstagramBusinessLoginService,
  InstagramIntegrationError,
} from "../src/infrastructure/instagram/InstagramBusinessLoginService";

const originalEnv = process.env;

function mockResponse(data: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 400,
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  } as unknown as Response;
}

describe("InstagramBusinessLoginService", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      INSTAGRAM_APP_ID: "1623344485849374",
      INSTAGRAM_APP_SECRET: "app-secret",
      INSTAGRAM_REDIRECT_URI:
        "https://api.churchapp.site/public/integrations/instagram/callback",
      INSTAGRAM_SCOPES:
        "instagram_business_basic",
      INSTAGRAM_GRAPH_API_VERSION: "v26.0",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("builds the Business Login authorization URL with the current scopes", () => {
    const service = new InstagramBusinessLoginService({ fetcher: jest.fn() as typeof fetch });

    const url = service.createAuthorizationUrl("state-123");
    const parsed = new URL(url);

    expect(parsed.origin + parsed.pathname).toBe(
      "https://www.instagram.com/oauth/authorize",
    );
    expect(parsed.searchParams.get("client_id")).toBe("1623344485849374");
    expect(parsed.searchParams.get("redirect_uri")).toBe(
      "https://api.churchapp.site/public/integrations/instagram/callback",
    );
    expect(parsed.searchParams.get("response_type")).toBe("code");
    expect(parsed.searchParams.get("scope")).toBe(
      "instagram_business_basic",
    );
    expect(parsed.searchParams.get("state")).toBe("state-123");
  });

  it("exchanges the authorization code and upgrades the token to long-lived", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        mockResponse({
          access_token: "short-token",
          user_id: "17841400000000001",
          permissions: ["instagram_business_basic"],
        }),
      )
      .mockResolvedValueOnce(
        mockResponse({
          access_token: "long-token",
          user_id: "17841400000000001",
          expires_in: 5184000,
        }),
      );
    const service = new InstagramBusinessLoginService({
      fetcher: fetchMock as unknown as typeof fetch,
    });

    const token = await service.exchangeCode("authorization-code");

    expect(token).toEqual({
      accessToken: "long-token",
      instagramUserId: "17841400000000001",
      expiresIn: 5184000,
      permissions: ["instagram_business_basic"],
    });

    const [shortTokenUrl, shortTokenRequest] = fetchMock.mock.calls[0];
    expect(shortTokenUrl).toBe("https://api.instagram.com/oauth/access_token");
    expect(shortTokenRequest.method).toBe("POST");
    expect(shortTokenRequest.body).toBeInstanceOf(URLSearchParams);
    expect(shortTokenRequest.body.toString()).toContain(
      "grant_type=authorization_code",
    );
    expect(shortTokenRequest.body.toString()).toContain(
      "redirect_uri=https%3A%2F%2Fapi.churchapp.site%2Fpublic%2Fintegrations%2Finstagram%2Fcallback",
    );
    expect(shortTokenRequest.body.toString()).toContain("code=authorization-code");

    const [longTokenUrl] = fetchMock.mock.calls[1];
    expect(longTokenUrl).toContain("https://graph.instagram.com/access_token?");
    expect(longTokenUrl).toContain("grant_type=ig_exchange_token");
    expect(longTokenUrl).toContain("access_token=short-token");
  });

  it("returns a safe integration error when Meta rejects the code", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      mockResponse({
        error_type: "OAuthException",
        error_message: "Invalid authorization code",
      }, false),
    );
    const service = new InstagramBusinessLoginService({
      fetcher: fetchMock as unknown as typeof fetch,
    });

    await expect(service.exchangeCode("bad-code")).rejects.toEqual(
      expect.objectContaining<Partial<InstagramIntegrationError>>({
        name: "InstagramIntegrationError",
      }),
    );
  });
});
