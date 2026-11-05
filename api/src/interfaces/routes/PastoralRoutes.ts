import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { PastoralAdapters } from "../adapters/pastoralAdapters";
import { VisitorFollowUpAdapters } from "../adapters/visitorFollowUpAdapters";

export async function PastoralRoutes(app: FastifyInstance) {
  const adapters = new PastoralAdapters();
  const visitorFollowUpAdapters = new VisitorFollowUpAdapters();

  app.get("/api/church/pastoral/dashboard", controllerHandler(adapters.getDashboard.bind(adapters)));
  app.get("/api/church/pastoral/visits", controllerHandler(adapters.listVisits.bind(adapters)));
  app.post("/api/church/pastoral/visits", controllerHandler(adapters.createVisit.bind(adapters)));
  app.patch("/api/church/pastoral/visits/:id", controllerHandler(adapters.updateVisit.bind(adapters)));
  app.delete("/api/church/pastoral/visits/:id", controllerHandler(adapters.deleteVisit.bind(adapters)));

  app.get(
    "/api/church/pastoral/visitors",
    controllerHandler(visitorFollowUpAdapters.list.bind(visitorFollowUpAdapters)),
  );
  app.post(
    "/api/church/pastoral/visitors",
    controllerHandler(visitorFollowUpAdapters.create.bind(visitorFollowUpAdapters)),
  );
  app.post(
    "/api/church/pastoral/visitors/:rosterMemberId/follow-up",
    controllerHandler(visitorFollowUpAdapters.save.bind(visitorFollowUpAdapters)),
  );
}
