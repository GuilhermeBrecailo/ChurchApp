import fp from "fastify-plugin";
import { createApp } from "../../app";

export default fp(async (fastify) => {
  const app = createApp();

  fastify.decorate("app", app); // ✅ fastify existe aqui
});

declare module "fastify" {
  interface FastifyInstance {
    app: ReturnType<typeof createApp>;
  }
}
