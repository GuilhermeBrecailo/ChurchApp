import { UpdateUserService } from "../../application/Services/User/UpdateUserService";
import { CreateUserUseCase } from "../../application/use-cases/User/CreateUserUseCase";
import { DeleteUserUseCase } from "../../application/use-cases/User/DeleteUserUseCase";
import { GetAllUserUseCase } from "../../application/use-cases/User/GetAllUserUseCase";
import { GetUserByIdUseCase } from "../../application/use-cases/User/GetUserByIdUseCase";
import { UpdateUserUseCase } from "../../application/use-cases/User/UpdateUserUseCase";

import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { UserController } from "../controllers/UserController";

const userRepository = new UserRepository();
const createUserUseCase = new CreateUserUseCase(userRepository);
const deleteUserUseCase = new DeleteUserUseCase(userRepository);
const getUserByIdUseCase = new GetUserByIdUseCase(userRepository);
const getAllUserUseCase = new GetAllUserUseCase(userRepository);
const updateUserUseCase = new UpdateUserUseCase(userRepository);

const updateUserService = new UpdateUserService(
  getUserByIdUseCase,
  updateUserUseCase,
);

const userController = new UserController(
  createUserUseCase,
  deleteUserUseCase,
  getUserByIdUseCase,
  getAllUserUseCase,
  updateUserService,
);

export class UserAdapters {
  constructor() {}

  async createUser() {
    return userController.create;
  }
  async deleteUser() {
    return userController.delete;
  }
  async getUserById() {
    return userController.get;
  }
  async getAllUsers() {
    return userController.getAll;
  }
  async updateUser() {
    return userController.update;
  }
}
