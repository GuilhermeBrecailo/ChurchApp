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
      const publicRoutes = [
        "/status",
        "/api/pastor/signup",
        "/public/auth/login",
        "/public/auth/refresh-token",
        "/public/auth/logout",
      ];

      const path = (request.routeOptions?.url || request.raw.url || "").split(
        "?",
      )[0];

      if (
        request.method === "OPTIONS" ||
        !path ||
        path.startsWith("/public") ||
        publicRoutes.includes(path)
      ) {
        return;
      }

      // atribui ID sequencial
      request.user = { id: String(nextId++) } as JwtDecoded;
    },
  );
};

export default fp(FakeAuth);
