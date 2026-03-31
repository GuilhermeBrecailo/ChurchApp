import { User } from "../../../domain/entities/User";
import { IUserRespository } from "../../../domain/repositories/IUserRepository";

export class CreateUserUseCase {
  constructor(private repository: IUserRespository) {}

  async execute(user: User): Promise<{ id: string }> {
    const result = await this.repository.createUser(user);
    return result;
  }
}
