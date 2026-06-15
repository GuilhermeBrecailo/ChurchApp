import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { ChurchRoleAdapters } from "../adapters/churchRoleAdapters";

export async function ChurchRoleRoutes(app: FastifyInstance) {
  const adapters = new ChurchRoleAdapters();

  app.get(
    "/api/church/roles",
    controllerHandler(adapters.getRoles.bind(adapters)),
  );

  app.post(
    "/api/church/roles",
    controllerHandler(adapters.createRole.bind(adapters)),
  );

  app.patch(
    "/api/church/roles/:id",
    controllerHandler(adapters.updateRole.bind(adapters)),
  );

  app.delete(
    "/api/church/roles/:id",
    controllerHandler(adapters.deleteRole.bind(adapters)),
  );

  app.patch(
    "/api/church/members/:id/church-role",
    controllerHandler(adapters.assignMemberRole.bind(adapters)),
  );
}
