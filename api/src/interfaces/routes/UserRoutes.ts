import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { UserAdapters } from "../adapters/userAdapters";

export async function UserRoutes(app: FastifyInstance) {
  const adapters = new UserAdapters();

  app.post(
    "/api/user/create",
    controllerHandler(adapters.createUser.bind(adapters)),
  );
  app.delete(
    "/api/user/delete",
    controllerHandler(adapters.deleteUser.bind(adapters)),
  );
  app.get(
    "/api/user/getById",
    controllerHandler(adapters.getUserById.bind(adapters)),
  );
  app.get(
    "/api/user/getAll",
    controllerHandler(adapters.getAllUsers.bind(adapters)),
  );
  app.post(
    "/api/user/update",
    controllerHandler(adapters.updateUser.bind(adapters)),
  );
}
