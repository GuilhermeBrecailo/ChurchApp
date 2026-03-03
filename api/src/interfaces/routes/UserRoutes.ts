import { FastifyInstance } from "fastify";
import { UserController } from "../controllers/UserController";
import { controllerHandler } from "../controllers/Handler";

export async function UserRoutes(app: FastifyInstance) {
  const controller = new UserController();

  app.post(
    "/api/user/create",
    controllerHandler(controller.create.bind(controller)),
  );
  app.delete(
    "/api/user/delete",
    controllerHandler(controller.delete.bind(controller)),
  );
  app.get(
    "/api/user/getById",
    controllerHandler(controller.get.bind(controller)),
  );
  app.get(
    "/api/user/getAll",
    controllerHandler(controller.getAll.bind(controller)),
  );
  app.post(
    "/api/user/update",
    controllerHandler(controller.update.bind(controller)),
  );
}
