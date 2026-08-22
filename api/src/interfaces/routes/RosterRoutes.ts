import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { RosterAdapters } from "../adapters/rosterAdapters";

export async function RosterRoutes(app: FastifyInstance) {
  const adapters = new RosterAdapters();

  app.get("/api/church/roster", controllerHandler(adapters.list.bind(adapters)));
  app.get("/api/church/roster/report", controllerHandler(adapters.getRosterReport.bind(adapters)));
  app.post("/api/church/roster", controllerHandler(adapters.create.bind(adapters)));
  app.patch("/api/church/roster/:id", controllerHandler(adapters.update.bind(adapters)));
  app.post("/api/church/roster/:id/promote", controllerHandler(adapters.promote.bind(adapters)));
  app.post("/api/church/roster/:id/leave", controllerHandler(adapters.markAsLeft.bind(adapters)));
  app.post("/api/church/roster/:id/restore", controllerHandler(adapters.restore.bind(adapters)));
  app.post(
    "/api/church/roster/:id/check-whatsapp",
    controllerHandler(adapters.checkWhatsAppNumber.bind(adapters)),
  );
  app.delete("/api/church/roster/:id", controllerHandler(adapters.remove.bind(adapters)));
}
