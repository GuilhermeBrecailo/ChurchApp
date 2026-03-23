import { FastifyRequest } from "fastify";
import { User, UserDto } from "../../domain/entities/User";
import { JwtDecoded } from "../../application/use-cases/Auth/JwtValidationUseCase";
import { CreateUserUseCase } from "../../application/use-cases/CreateUserUseCase";
import { DeleteUserUseCase } from "../../application/use-cases/DeleteUserUseCase";
import { GetUserByIdUseCase } from "../../application/use-cases/GetUserByIdUseCase";
import { GetAllUserUseCase } from "../../application/use-cases/GetAllUserUseCase";
import { UpdateUserService } from "../../application/Services/UpdateUserService";

export class UserController {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private deleteUserUseCase: DeleteUserUseCase,
    private getUserByIdUseCase: GetUserByIdUseCase,
    private getAllUserUseCase: GetAllUserUseCase,
    private updateUserService: UpdateUserService,
  ) {}

  async create(request: FastifyRequest): Promise<{ id: string }> {
    const { id } = request.user as JwtDecoded;
    const { name, email, phone } = request.body as UserDto;

    const payload = {
      id,
      name,
      email,
      phone,
    };

    return await this.createUserUseCase.execute(payload);
  }

  async delete(request: FastifyRequest): Promise<{ success: boolean }> {
    const { id } = request.body as { id: string };

    await this.deleteUserUseCase.execute(id);

    return { success: true };
  }

  async get(request: FastifyRequest): Promise<User> {
    const { id } = request.body as { id: string };

    return await this.getUserByIdUseCase.execute(id);
  }

  async getAll(request: FastifyRequest): Promise<User[]> {
    return await this.getAllUserUseCase.execute();
  }

  async update(request: FastifyRequest): Promise<void> {
    const { id } = request.body as { id: string };
    const { name, email, phone } = request.body as UserDto;

    const payload = {
      id,
      name,
      email,
      phone,
    };

    await this.updateUserService.handle(payload);
  }
}
