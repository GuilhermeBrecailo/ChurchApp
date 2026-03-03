import fp from "fastify-plugin";
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";

// contador global de IDs
let nextId = 1;

export interface JwtDecoded {
  id: string;
}

// plugin para popular request.user com IDs sequenciais
const FakeAuth: FastifyPluginAsync = async (fastify) => {
  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      // rotas públicas que não precisam de ID (opcional)
      const publicRoutes = [
        "/auth/register",
        "/auth/login-admin",
        "/storage/v1/temp/clean",
      ];

      const path = request.routeOptions?.url || request.raw.url;
      if (!path || path.startsWith("/public") || publicRoutes.includes(path)) {
        return;
      }

      // atribui ID sequencial
      request.user = { id: String(nextId++) } as JwtDecoded;
    },
  );
};

export default fp(FakeAuth);
