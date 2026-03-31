import { FastifyInstance } from "fastify";
import { CrunchAdapters } from "../adapters/crunchAdapters";
import { controllerHandler } from "../controllers/Handler";

export async function CrunchRoutes(app: FastifyInstance) {
  const adapters = new CrunchAdapters();

  app.post(
    "/api/crunch/create",
    controllerHandler(adapters.createCrunch.bind(adapters)),
  );
  app.delete(
    "/api/crunch/delete",
    controllerHandler(adapters.deleteCrunch.bind(adapters)),
  );
  app.post(
    "/api/crunch/getById",
    controllerHandler(adapters.getCrunchById.bind(adapters)),
  );
  app.get(
    "/api/crunch/getAll",
    controllerHandler(adapters.getAllCrunchs.bind(adapters)),
  );
  app.post(
    "/api/crunch/update",
    controllerHandler(adapters.updateCrunch.bind(adapters)),
  );
}
