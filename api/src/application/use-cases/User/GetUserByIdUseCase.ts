import { User } from "../../../domain/entities/User";
import { IUserRespository } from "../../../domain/repositories/IUserRepository";

export class GetUserByIdUseCase {
  constructor(private repository: IUserRespository) {}

  async execute(id: string): Promise<User> {
    const result = await this.repository.getUserbyId(id);

    return result;
  }
}
