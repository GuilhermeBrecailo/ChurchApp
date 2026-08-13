import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { ChurchInviteAdapters } from "../adapters/churchInviteAdapters";

export async function ChurchInviteRoutes(app: FastifyInstance) {
  const adapters = new ChurchInviteAdapters();

  app.get(
    "/api/church/invite-code",
    controllerHandler(adapters.getInviteCode.bind(adapters)),
  );

  app.post(
    "/api/church/invite-code/regenerate",
    controllerHandler(adapters.regenerateInviteCode.bind(adapters)),
  );

  app.post(
    "/api/church/join",
    controllerHandler(adapters.joinByCode.bind(adapters)),
  );

  // Publicas (sem auth - path comeca com /public, ver TenantHandler.ts):
  // usadas pela pagina de auto-cadastro via link de convite.
  app.get(
    "/public/church/invite/:code",
    controllerHandler(adapters.getChurchByCode.bind(adapters)),
  );

  app.post(
    "/public/church/invite/:code/register",
    controllerHandler(adapters.registerByCode.bind(adapters)),
  );
}
