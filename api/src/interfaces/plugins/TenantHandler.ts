import fp from "fastify-plugin";
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";

const TenantHandler: FastifyPluginAsync = async (fastify) => {
  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const publicRoutes = [
        "/auth/register",
        "/auth/login-admin",
        "/storage/v1/temp/clean",
      ];

      const path = request.routeOptions?.url || request.raw.url;
      if (!path || path.startsWith("/public") || publicRoutes.includes(path)) {
        return; // rota pública → não precisa de token
      }

      const authHeader = request.headers.authorization;
      if (!authHeader) {
        reply.code(401).send({ error: "Token não fornecido" });
        return;
      }

      const token = authHeader.replace("Bearer ", "");
      const { jwtValidationService } = request.server.app.auth;

      try {
        const payload = await jwtValidationService.execute(token);
        request.user = payload; // ⚡ aqui você popula request.user
      } catch (err) {
        reply.code(403).send({ error: "Token inválido" });
      }
    },
  );
};

export default fp(TenantHandler);
