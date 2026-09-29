import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { HolyricsAdapters } from "../adapters/holyricsAdapters";

export async function HolyricsRoutes(app: FastifyInstance) {
  const adapters = new HolyricsAdapters();

  app.get(
    "/api/church/holyrics/status",
    controllerHandler(adapters.status.bind(adapters)),
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
