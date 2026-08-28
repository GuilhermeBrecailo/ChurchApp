import fp from "fastify-plugin";
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { JwtValidationUseCase } from "../../application/use-cases/Auth/JwtValidationUseCase";
import { resolveActiveChurchContext } from "../utils/churchContext";

const jwtValidationService = new JwtValidationUseCase();

const publicRoutes = new Set([
  "/status",
  "/api/pastor/signup",
  "/api/webhooks/instagram",
  "/public/auth/login",
  "/public/auth/refresh-token",
  "/public/auth/logout",
]);

function getRoutePath(request: FastifyRequest) {
  return (request.raw.url || request.routeOptions?.url || "").split("?")[0];
}

function isPublicRequest(request: FastifyRequest) {
  const path = getRoutePath(request);

  return (
    request.method === "OPTIONS" ||
    !path ||
    path.startsWith("/public") ||
    path.startsWith("/uploads/") ||
    publicRoutes.has(path)
  );
}

const TenantHandler: FastifyPluginAsync = async (fastify) => {
  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (isPublicRequest(request)) {
        return;
      }

      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return reply
          .code(401)
          .send({ error: "Token não fornecido", status: 401 });
      }

      const token = authHeader.replace("Bearer ", "");

      try {
        const payload = await jwtValidationService.execute(token);
        const churchContext = await resolveActiveChurchContext(request, payload.sub);

        request.user = payload;
        request.churchContext = churchContext;

        if (churchContext.activeChurchId) {
          request.user.tenant_id = churchContext.activeChurchId;
          request.user.role = churchContext.role;
        }
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Token inválido";

        return reply.code(403).send({ error: message, status: 403 });
      }
    },
  );
};

export default fp(TenantHandler);
