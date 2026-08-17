import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { WhatsAppAdapters } from "../adapters/whatsappAdapters";

export async function WhatsAppRoutes(app: FastifyInstance) {
  const adapters = new WhatsAppAdapters();

  app.get(
    "/api/church/whatsapp/status",
    controllerHandler(adapters.status.bind(adapters)),
  );

  app.post(
    "/api/church/whatsapp/connect",
    controllerHandler(adapters.connect.bind(adapters)),
  );

  app.post(
    "/api/church/whatsapp/disconnect",
    controllerHandler(adapters.disconnect.bind(adapters)),
  );
}
