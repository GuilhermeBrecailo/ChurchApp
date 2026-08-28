import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { InstagramAdapters } from "../adapters/instagramAdapters";

export async function InstagramRoutes(app: FastifyInstance) {
  const adapters = new InstagramAdapters();

  app.get(
    "/api/church/integrations/instagram/connect",
    controllerHandler(adapters.getConnectUrl.bind(adapters)),
  );

  app.get(
    "/api/church/integrations/instagram/status",
    controllerHandler(adapters.status.bind(adapters)),
  );

  app.get(
    "/api/webhooks/instagram",
    adapters.verifyWebhook.bind(adapters),
  );

  app.post(
    "/api/webhooks/instagram",
    adapters.receiveWebhook.bind(adapters),
  );

  app.post(
    "/api/church/integrations/instagram/disconnect",
    controllerHandler(adapters.disconnect.bind(adapters)),
  );

  app.post(
    "/public/integrations/instagram/deauthorize",
    adapters.deauthorize.bind(adapters),
  );

  app.post(
    "/public/integrations/instagram/data-deletion",
    adapters.dataDeletion.bind(adapters),
  );

  app.get(
    "/public/integrations/instagram/data-deletion/status/:confirmationCode",
    adapters.dataDeletionStatus.bind(adapters),
  );

  app.get(
    "/public/integrations/instagram/callback",
    adapters.callback.bind(adapters),
  );
}
