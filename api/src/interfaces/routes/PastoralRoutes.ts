import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { PastoralAdapters } from "../adapters/pastoralAdapters";

export async function PastoralRoutes(app: FastifyInstance) {
  const adapters = new PastoralAdapters();

  app.get("/api/church/pastoral/dashboard", controllerHandler(adapters.getDashboard.bind(adapters)));
  app.get("/api/church/pastoral/visits", controllerHandler(adapters.listVisits.bind(adapters)));
  app.post("/api/church/pastoral/visits", controllerHandler(adapters.createVisit.bind(adapters)));
  app.patch("/api/church/pastoral/visits/:id", controllerHandler(adapters.updateVisit.bind(adapters)));
  app.delete("/api/church/pastoral/visits/:id", controllerHandler(adapters.deleteVisit.bind(adapters)));
}
