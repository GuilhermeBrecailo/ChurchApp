import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { ChurchDepartmentAdapters } from "../adapters/churchDepartmentAdapters";

export async function ChurchDepartmentRoutes(app: FastifyInstance) {
  const adapters = new ChurchDepartmentAdapters();

  app.get(
    "/api/church/departments",
    controllerHandler(adapters.getChurchDepartments.bind(adapters)),
  );

  app.get(
    "/api/church/departments/:id",
    controllerHandler(adapters.getChurchDepartmentById.bind(adapters)),
  );

  app.post(
    "/api/church/departments",
    controllerHandler(adapters.createChurchDepartment.bind(adapters)),
  );

  app.get(
    "/api/church/departments/:id/tasks",
    controllerHandler(adapters.getChurchDepartmentTasks.bind(adapters)),
  );

  app.post(
    "/api/church/departments/:id/tasks",
    controllerHandler(adapters.createChurchDepartmentTask.bind(adapters)),
  );
}
