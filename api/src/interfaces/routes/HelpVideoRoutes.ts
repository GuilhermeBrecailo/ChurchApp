import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { HelpVideoAdapters } from "../adapters/helpVideoAdapters";

export async function HelpVideoRoutes(app: FastifyInstance) {
  const adapters = new HelpVideoAdapters();

  app.get("/api/help-videos", controllerHandler(adapters.list.bind(adapters)));
  app.put("/api/help-videos", controllerHandler(adapters.upsert.bind(adapters)));
  app.post(
    "/api/help-videos/upload",
    controllerHandler(adapters.uploadVideo.bind(adapters)),
  );
  app.delete("/api/help-videos", controllerHandler(adapters.remove.bind(adapters)));
}
