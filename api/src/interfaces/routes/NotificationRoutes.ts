import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { NotificationAdapters } from "../adapters/notificationAdapters";

export async function NotificationRoutes(app: FastifyInstance) {
  const adapters = new NotificationAdapters();

  app.get(
    "/api/notifications/public-key",
    controllerHandler(adapters.getPublicKey.bind(adapters)),
  );

  app.post(
    "/api/notifications/subscribe",
    controllerHandler(adapters.subscribe.bind(adapters)),
  );

  app.delete(
    "/api/notifications/subscribe",
    controllerHandler(adapters.unsubscribe.bind(adapters)),
  );
}
