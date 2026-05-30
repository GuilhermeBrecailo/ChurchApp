import fp from "fastify-plugin";
import fastifyExpress from "fastify-express";
import session from "express-session";
import Keycloak from "keycloak-connect";
import { FastifyPluginAsync } from "fastify";

// Configuração do Keycloak
const memoryStore = new session.MemoryStore();
const keycloak = new Keycloak({ store: memoryStore });

const KeycloakPlugin: FastifyPluginAsync = async (fastify) => {
  // ⚡ precisa do express adapter
  await fastify.register(fastifyExpress);

  // registra session
  fastify.use(
    session({
      secret: "alguma_chave_secreta",
      resave: false,
      saveUninitialized: true,
      store: memoryStore,
    }),
  );

  // registra Keycloak
  fastify.use(keycloak.middleware());

  // hook para popular request.user
  fastify.addHook("preHandler", async (request, reply) => {
    // rotas públicas não precisam de token
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

    // pega o token do Keycloak
    const kcToken = (request as any).kauth?.grant?.access_token?.content;
    if (!kcToken) {
      reply.code(401).send({ error: "Token não fornecido" });
      return;
    }

    // popula request.user
    request.user = {
      id: kcToken.sub, // id do usuário Keycloak
      // outros campos que você quiser
    };
  });
};

export default fp(KeycloakPlugin);
