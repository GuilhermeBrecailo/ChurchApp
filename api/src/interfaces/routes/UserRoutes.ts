import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { UserAdapters } from "../adapters/userAdapters";

export async function UserRoutes(app: FastifyInstance) {
  const adapters = new UserAdapters();

  app.post(
    "/api/pastor/signup",
    controllerHandler(adapters.createPastor.bind(adapters)),
  );

  app.get("/api/me", controllerHandler(adapters.getMe.bind(adapters)));

  app.get(
    "/api/me/profile",
    controllerHandler(adapters.getMyProfile.bind(adapters)),
  );

  app.patch(
    "/api/me/profile",
    controllerHandler(adapters.updateMyProfile.bind(adapters)),
  );

  app.post(
    "/api/church/create-own",
    controllerHandler(adapters.createOwnChurch.bind(adapters)),
  );

  app.get(
    "/api/church/members",
    controllerHandler(adapters.getChurchMembers.bind(adapters)),
  );

  app.post(
    "/api/church/members",
    controllerHandler(adapters.createChurchMember.bind(adapters)),
  );

  app.patch(
    "/api/church/members/:id/permissions",
    controllerHandler(adapters.updateChurchMemberPermissions.bind(adapters)),
  );

}
