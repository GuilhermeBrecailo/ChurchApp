import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { DevotionalAdapters } from "../adapters/devotionalAdapters";

export async function DevotionalRoutes(app: FastifyInstance) {
  const adapters = new DevotionalAdapters();

  app.get(
    "/api/church/devotionals",
    controllerHandler(adapters.listDevotionals.bind(adapters)),
  );

  app.get(
    "/api/church/devotionals/:id",
    controllerHandler(adapters.getDevotional.bind(adapters)),
  );

  app.post(
    "/api/church/devotionals",
    controllerHandler(adapters.createDevotional.bind(adapters)),
  );

  app.delete(
    "/api/church/devotionals/:id",
    controllerHandler(adapters.deleteDevotional.bind(adapters)),
  );

  app.patch(
    "/api/church/devotionals/:id/progress",
    controllerHandler(adapters.updateProgress.bind(adapters)),
  );
}
