import { IUserRespository } from "../../domain/repositories/IUserRepository";

export class DeleteUserUseCase {
  constructor(private repository: IUserRespository) {}

  async execute(id: string): Promise<void> {
    const result = await this.repository.deleteUser(id);

    return result;
  }
}
