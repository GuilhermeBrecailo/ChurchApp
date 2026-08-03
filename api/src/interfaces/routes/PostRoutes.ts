import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { PostAdapters } from "../adapters/postAdapters";

export async function PostRoutes(app: FastifyInstance) {
  const adapters = new PostAdapters();

  app.get(
    "/api/church/posts",
    controllerHandler(adapters.listPosts.bind(adapters)),
  );

  app.post(
    "/api/church/posts",
    controllerHandler(adapters.createPost.bind(adapters)),
  );

  app.patch(
    "/api/church/posts/:id",
    controllerHandler(adapters.updatePost.bind(adapters)),
  );

  app.delete(
    "/api/church/posts/:id",
    controllerHandler(adapters.deletePost.bind(adapters)),
  );

  app.post(
    "/api/church/uploads/image",
    controllerHandler(adapters.uploadImage.bind(adapters)),
  );
}
