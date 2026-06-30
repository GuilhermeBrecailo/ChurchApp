import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { DailyVerseAdapters } from "../adapters/dailyVerseAdapters";

export async function DailyVerseRoutes(app: FastifyInstance) {
  const adapters = new DailyVerseAdapters();

  app.get(
    "/api/church/daily-verse",
    controllerHandler(adapters.getLatestDailyVerse.bind(adapters)),
  );

  app.get(
    "/api/church/daily-verse/list",
    controllerHandler(adapters.listDailyVerses.bind(adapters)),
  );

  app.post(
    "/api/church/daily-verse",
    controllerHandler(adapters.createDailyVerse.bind(adapters)),
  );
}
