import { FastifyInstance } from "fastify";
import { AuthAdapters } from "../adapters/authAdapters";
import { controllerHandler } from "../controllers/Handler";
import { authRateLimits } from "../plugins/RateLimit";

export async function AuthRoutes(app: FastifyInstance) {
  const adapters = new AuthAdapters();

  app.post(
    "/public/auth/login",
    { config: { rateLimit: authRateLimits.login } },
    controllerHandler(adapters.login.bind(adapters)),
  );

  app.get(
    "/public/auth/refresh-token",
    { config: { rateLimit: authRateLimits.refreshToken } },
    controllerHandler(adapters.refreshToken.bind(adapters)),
  );

  app.post(
    "/public/auth/refresh-token",
    { config: { rateLimit: authRateLimits.refreshToken } },
    controllerHandler(adapters.refreshToken.bind(adapters)),
  );

  app.get(
    "/public/auth/logout",
    controllerHandler(adapters.logout.bind(adapters)),
  );
}
