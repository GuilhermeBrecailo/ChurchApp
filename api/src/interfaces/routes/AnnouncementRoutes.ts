import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { AnnouncementAdapters } from "../adapters/announcementAdapters";

export async function AnnouncementRoutes(app: FastifyInstance) {
  const adapters = new AnnouncementAdapters();

  app.get(
    "/api/church/announcements",
    controllerHandler(adapters.getAnnouncements.bind(adapters)),
  );

  app.post(
    "/api/church/announcements",
    controllerHandler(adapters.createAnnouncement.bind(adapters)),
  );

  app.delete(
    "/api/church/announcements/:id",
    controllerHandler(adapters.deleteAnnouncement.bind(adapters)),
  );
}
