import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { PublicChurchAdapters } from "../adapters/publicChurchAdapters";

export async function PublicChurchRoutes(app: FastifyInstance) {
  const adapters = new PublicChurchAdapters();

  app.get("/public/churches/sitemap", controllerHandler(adapters.listSitemapSlugs.bind(adapters)));
  app.get("/public/church/:slug", controllerHandler(adapters.getChurch.bind(adapters)));
  app.get("/public/church/:slug/service-times", controllerHandler(adapters.getServiceTimes.bind(adapters)));
  app.post("/public/church/:slug/notifications/subscribe", controllerHandler(adapters.subscribe.bind(adapters)));
  app.delete("/public/church/:slug/notifications/subscribe", controllerHandler(adapters.unsubscribe.bind(adapters)));
}