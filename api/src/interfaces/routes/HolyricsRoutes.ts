import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { HolyricsAdapters } from "../adapters/holyricsAdapters";

export async function HolyricsRoutes(app: FastifyInstance) {
  const adapters = new HolyricsAdapters();

  app.get(
    "/api/church/holyrics/status",
    controllerHandler(adapters.status.bind(adapters)),
  );

  app.get(
    "/api/church/holyrics/capabilities",
    controllerHandler(adapters.capabilities.bind(adapters)),
  );

  app.get(
    "/api/church/holyrics/current-schedule",
    controllerHandler(adapters.currentSchedule.bind(adapters)),
  );

  app.get(
    "/api/church/holyrics/current-presentation",
    controllerHandler(adapters.currentPresentation.bind(adapters)),
  );

  app.get(
    "/api/church/holyrics/media",
    controllerHandler(adapters.searchMedia.bind(adapters)),
  );

  app.post(
    "/api/church/holyrics/connect",
    controllerHandler(adapters.connect.bind(adapters)),
  );

  app.post(
    "/api/church/holyrics/disconnect",
    controllerHandler(adapters.disconnect.bind(adapters)),
  );

  app.post(
    "/api/church/holyrics/schedules/:id/sync",
    controllerHandler(adapters.syncSchedule.bind(adapters)),
  );
}
