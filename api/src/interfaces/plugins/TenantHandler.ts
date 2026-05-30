import fp from "fastify-plugin";
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { JwtValidationUseCase } from "../../application/use-cases/Auth/JwtValidationUseCase";

const jwtValidationService = new JwtValidationUseCase();

const publicRoutes = new Set([
  "/status",
  "/api/pastor/signup",
  "/public/auth/login",
  "/public/auth/refresh-token",
  "/public/auth/logout",
]);

function getRoutePath(request: FastifyRequest) {
  return (request.routeOptions?.url || request.raw.url || "").split("?")[0];
}

function isPublicRequest(request: FastifyRequest) {
  const path = getRoutePath(request);

  return (
    request.method === "OPTIONS" ||
    !path ||
    path.startsWith("/public") ||
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
        request.user = payload;
      } catch {
        return reply.code(403).send({ error: "Token inválido", status: 403 });
      }
    },
  );
};

export default fp(TenantHandler);
