import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { AdminAdapters } from "../adapters/adminAdapters";

export async function AdminRoutes(app: FastifyInstance) {
  const adapters = new AdminAdapters();

  app.get(
    "/api/admin/churches",
    controllerHandler(adapters.getChurches.bind(adapters)),
  );

  app.get(
    "/api/admin/departments",
    controllerHandler(adapters.getDepartments.bind(adapters)),
  );

  app.get(
    "/api/admin/churches/:id",
    controllerHandler(adapters.getChurchById.bind(adapters)),
  );

  app.patch(
    "/api/admin/churches/:id/plan",
    controllerHandler(adapters.setChurchPlan.bind(adapters)),
  );

  app.patch(
    "/api/admin/churches/:churchId/users/:userId",
    controllerHandler(adapters.updateChurchUserByAdmin.bind(adapters)),
  );

  app.post(
    "/api/admin/churches/:churchId/users/:userId/reset-password",
    controllerHandler(adapters.resetChurchUserPasswordByAdmin.bind(adapters)),
  );

  app.delete(
    "/api/admin/churches/:churchId/users/:userId",
    controllerHandler(adapters.removeChurchUserByAdmin.bind(adapters)),
  );
}
