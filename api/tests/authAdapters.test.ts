const mockPrismaClient = {
  user: { findUnique: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import { AuthAdapters } from "../src/interfaces/adapters/authAdapters";
import { DomainError } from "../src/domain/value-objects/utils/DomainError";
import { DomainToken } from "../src/domain/value-objects/utils/DomainToken";
import { FastifyReply, FastifyRequest } from "fastify";

function makeReply(): FastifyReply {
  return { header: jest.fn() } as unknown as FastifyReply;
}

function makeLoginRequest(body: Record<string, unknown>): FastifyRequest {
  return { body } as unknown as FastifyRequest;
}

function makeCookieRequest(cookie: string | undefined): FastifyRequest {
  return {
    headers: cookie ? { cookie } : {},
    id: "req-1",
    log: { warn: jest.fn(), info: jest.fn() },
  } as unknown as FastifyRequest;
}

function extractSetCookieValue(reply: FastifyReply, name: string): string | undefined {
  const headerMock = reply.header as jest.Mock;
  const call = headerMock.mock.calls.find((args) => args[0] === "Set-Cookie");
  if (!call) return undefined;
  const cookies = call[1] as string[];
  // refreshCookieHeaders() always returns [clearHostOnlyCookie, realCookie] -
  // both start with "name=", so take the LAST match, not the first.
  const match = [...cookies].reverse().find((c) => c.startsWith(`${name}=`));
  return match?.split(";")[0]?.slice(name.length + 1);
}

describe("AuthAdapters", () => {
  let adapters: AuthAdapters;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new AuthAdapters();
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe("login", () => {
    it("throws DomainError when email is missing", async () => {
      const request = makeLoginRequest({ password: "x" });
      await expect(adapters.login(request, makeReply())).rejects.toThrow(DomainError);
    });

    it("throws DomainError when password is missing", async () => {
      const request = makeLoginRequest({ email: "a@b.com" });
      await expect(adapters.login(request, makeReply())).rejects.toThrow(DomainError);
    });

    it("logs in via the demo shortcut without hitting Keycloak when the demo user exists", async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: "demo-user-1",
        email: "demo@appquadrangular.com",
        name: "Demo",
        role: "PASTOR",
        crunchId: "church-demo",
        isDemoUser: true,
      });

      const reply = makeReply();
      const request = makeLoginRequest({
        email: "demo@appquadrangular.com",
        password: "demo1234",
      });

      const result = await adapters.login(request, reply);

      expect(result.token_type).toBe("Bearer");
      expect(result.scope).toBe("demo");
      expect(global.fetch).not.toHaveBeenCalled();
      expect(extractSetCookieValue(reply, "refresh_token")).toBeTruthy();
    });

    it("falls through to Keycloak when the demo user is not flagged isDemoUser", async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: "demo-user-1",
        email: "demo@appquadrangular.com",
        isDemoUser: false,
        crunchId: "church-demo",
      });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: "kc-access",
          expires_in: 300,
          refresh_expires_in: 1800,
          refresh_token: "kc-refresh",
          token_type: "Bearer",
          scope: "",
        }),
      });

      const request = makeLoginRequest({
        email: "demo@appquadrangular.com",
        password: "demo1234",
      });

      const result = await adapters.login(request, makeReply());

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.access_token).toBe("kc-access");
    });

    it("logs in via Keycloak for regular credentials and sets the refresh cookie", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: "kc-access-2",
          expires_in: 300,
          refresh_expires_in: 1800,
          refresh_token: "kc-refresh-2",
          token_type: "Bearer",
          scope: "",
        }),
      });

      const reply = makeReply();
      const request = makeLoginRequest({ email: "pastor@igreja.com", password: "secret123" });

      const result = await adapters.login(request, reply);

      expect(result.access_token).toBe("kc-access-2");
      expect(extractSetCookieValue(reply, "refresh_token")).toBe("kc-refresh-2");
    });

    it("throws DomainError when Keycloak rejects the credentials", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "invalid_grant" }),
      });

      const request = makeLoginRequest({ email: "pastor@igreja.com", password: "wrong" });

      await expect(adapters.login(request, makeReply())).rejects.toThrow(DomainError);
    });
  });

  describe("refreshToken", () => {
    it("throws DomainToken when the refresh cookie is missing", async () => {
      const request = makeCookieRequest(undefined);
      await expect(adapters.refreshToken(request, makeReply())).rejects.toThrow(DomainToken);
    });

    it("refreshes a demo session end-to-end using the token minted by login", async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: "demo-user-1",
        email: "demo@appquadrangular.com",
        name: "Demo",
        role: "PASTOR",
        crunchId: "church-demo",
        isDemoUser: true,
      });

      const loginReply = makeReply();
      await adapters.login(
        makeLoginRequest({ email: "demo@appquadrangular.com", password: "demo1234" }),
        loginReply,
      );
      const demoRefreshToken = extractSetCookieValue(loginReply, "refresh_token")!;

      const reply = makeReply();
      const request = makeCookieRequest(`refresh_token=${encodeURIComponent(demoRefreshToken)}`);

      const result = await adapters.refreshToken(request, reply);

      expect(result.scope).toBe("demo");
      expect(global.fetch).not.toHaveBeenCalled();
      expect(extractSetCookieValue(reply, "refresh_token")).toBeTruthy();
    });

    it("refreshes via Keycloak and rotates the refresh cookie", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: "kc-access-new",
          expires_in: 300,
          refresh_expires_in: 1800,
          refresh_token: "kc-refresh-new",
          token_type: "Bearer",
          scope: "",
        }),
      });

      const reply = makeReply();
      const request = makeCookieRequest("refresh_token=some-opaque-keycloak-token");

      const result = await adapters.refreshToken(request, reply);

      expect(result.access_token).toBe("kc-access-new");
      expect(extractSetCookieValue(reply, "refresh_token")).toBe("kc-refresh-new");
    });

    it("throws DomainToken when Keycloak refuses the refresh token", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: "invalid_grant" }),
      });

      const request = makeCookieRequest("refresh_token=some-expired-token");

      await expect(adapters.refreshToken(request, makeReply())).rejects.toThrow(DomainToken);
    });
  });

  describe("logout", () => {
    it("clears the refresh cookie and returns success", async () => {
      const reply = makeReply();
      const result = await adapters.logout({} as FastifyRequest, reply);

      expect(result).toEqual({ success: true });
      const headerMock = reply.header as jest.Mock;
      expect(headerMock).toHaveBeenCalledWith("Set-Cookie", expect.any(Array));
      const cookies = headerMock.mock.calls[0][1] as string[];
      expect(cookies.some((c) => c.startsWith("refresh_token=;"))).toBe(true);
    });
  });
});
