import "fastify";
import { JwtDecoded } from "../application/use-cases/Auth/JwtValidationUseCase";
import { User } from "../domain/entities/User";

type UserContainer = {
  createUserUseCase: {
    execute: (user: User) => Promise<unknown>;
  };
  deleteUserUseCase: {
    execute: (id: string) => Promise<unknown>;
  };
  getUserByIdUseCase: {
    execute: (id: string) => Promise<unknown>;
  };
  getAllUserUseCase: {
    execute: () => Promise<unknown>;
  };
  updateUserService: {
    handle: (props: { id: string; name: string; email: string }) => Promise<void>;
  };
};

declare module "fastify" {
  // Isso adiciona user ao request
  interface FastifyRequest {
    user: Partial<JwtDecoded>;
  }

  interface FastifyInstance {
    app: {
      user: UserContainer;
    };
    use: (...handlers: unknown[]) => FastifyInstance;
  }
}
