import { UpdateUserService } from "./application/Services/UpdateUserService";
import { CreateUserUseCase } from "./application/use-cases/CreateUserUseCase";
import { DeleteUserUseCase } from "./application/use-cases/DeleteUserUseCase";
import { GetAllUserUseCase } from "./application/use-cases/GetAllUserUseCase";
import { GetUserByIdUseCase } from "./application/use-cases/GetUserByIdUseCase";
import { UpdateUserUseCase } from "./application/use-cases/UpdateUserUseCase";
import { UserRepository } from "./infrastructure/repositories/UserRepository";

export function createApp() {
  const user_db = new UserRepository();
  const createUserUseCase = new CreateUserUseCase(user_db);
  const deleteUserUseCase = new DeleteUserUseCase(user_db);
  const getAllUserUseCase = new GetAllUserUseCase(user_db);
  const getUserByIdUseCase = new GetUserByIdUseCase(user_db);
  const updateUserUseCase = new UpdateUserUseCase(user_db);

  const updateUserService = new UpdateUserService(
    getUserByIdUseCase,
    updateUserUseCase,
  );

  return {
    user: {
      createUserUseCase,
      deleteUserUseCase,
      getAllUserUseCase,
      getUserByIdUseCase,
      updateUserUseCase,
      updateUserService,
    },
  };
}
