import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { RosterAdapters } from "../adapters/rosterAdapters";
import { PeopleAdapters } from "../adapters/peopleAdapters";

export async function RosterRoutes(app: FastifyInstance) {
  const adapters = new RosterAdapters();
  const people = new PeopleAdapters();

  // Diretorio unico de pessoas (rol + contas + pendentes + acolhimento +
  // cuidado), filtrado pela permissao de quem pede.
  app.get("/api/church/people", controllerHandler(people.list.bind(people)));
  app.get("/api/church/people/:rosterId", controllerHandler(people.get.bind(people)));

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
  app.post("/api/church/roster/:id/consent", controllerHandler(adapters.updateConsent.bind(adapters)));
  app.delete("/api/church/roster/:id", controllerHandler(adapters.remove.bind(adapters)));
}
