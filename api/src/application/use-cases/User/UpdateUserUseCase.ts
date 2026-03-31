import { User } from "../../../domain/entities/User";
import { IUserRespository } from "../../../domain/repositories/IUserRepository";

export class UpdateUserUseCase {
  constructor(private repository: IUserRespository) {}

  async execute(user: User): Promise<void> {
    const result = await this.repository.updateUser(user);

    return result;
  }
}
