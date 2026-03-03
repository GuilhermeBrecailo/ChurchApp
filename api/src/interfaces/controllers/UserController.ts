import { FastifyRequest } from "fastify";
import { User, UserDto } from "../../domain/entities/User";
import { JwtDecoded } from "../../application/use-cases/Auth/JwtValidationUseCase";

export class UserController {
  async create(request: FastifyRequest): Promise<{ id: string }> {
    // const { id } = request.user as JwtDecoded;
    const { id } = "130298409223" as any; // ID fixo para testes
    const { name, email, phone } = request.body as UserDto;

    const payload = {
      id,
      name,
      email,
      phone,
    };

    const { createUserUseCase } = request.server.app.user;

    return await createUserUseCase.execute(payload);
  }

  async delete(request: FastifyRequest): Promise<{ success: boolean }> {
    const { id } = request.body as { id: string };

    const { deleteUserUseCase } = request.server.app.user;

    await deleteUserUseCase.execute(id);

    return { success: true };
  }

  async get(request: FastifyRequest): Promise<User> {
    const { id } = request.body as { id: string };

    const { getUserByIdUseCase } = request.server.app.user;

    return await getUserByIdUseCase.execute(id);
  }

  async getAll(request: FastifyRequest): Promise<User[]> {
    const { getAllUserUseCase } = request.server.app.user;

    return await getAllUserUseCase.execute();
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

    const { updateUserService } = request.server.app.user;

    await updateUserService.handle(payload);
  }
}
