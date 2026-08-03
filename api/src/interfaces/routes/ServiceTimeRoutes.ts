import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { ServiceTimeAdapters } from "../adapters/serviceTimeAdapters";

export async function ServiceTimeRoutes(app: FastifyInstance) {
  const adapters = new ServiceTimeAdapters();

  app.get("/api/church/service-times", controllerHandler(adapters.list.bind(adapters)));
  app.post("/api/church/service-times", controllerHandler(adapters.create.bind(adapters)));
  app.patch("/api/church/service-times/:id", controllerHandler(adapters.update.bind(adapters)));
  app.delete("/api/church/service-times/:id", controllerHandler(adapters.remove.bind(adapters)));
}