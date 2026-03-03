import { User } from "../../domain/entities/User";
import { IUserRespository } from "../../domain/repositories/IUserRepository";

export class GetAllUserUseCase {
  constructor(private repository: IUserRespository) {}

  async execute(): Promise<User[]> {
    const result = await this.repository.getAllUsers();
    return result;
  }
}
