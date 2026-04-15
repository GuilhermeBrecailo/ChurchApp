import { User } from "../../../domain/entities/User";
import { DomainError } from "../../../domain/value-objects/utils/DomainError";
import { GetUserByIdUseCase } from "../../use-cases/User/GetUserByIdUseCase";
import { UpdateUserUseCase } from "../../use-cases/User/UpdateUserUseCase";

export class UpdateUserService {
  constructor(
    private getUserByIdUseCase: GetUserByIdUseCase,
    private updateUserUseCase: UpdateUserUseCase,
  ) {}

  async handle(props: { id: string; name: string; email: string }) {
    const user = await this.getUserByIdUseCase.execute(props.id);
    if (!user || !user.id) {
      throw new DomainError("nao existe nenhum usuario com este ID");
    }

    await this.updateUserUseCase.execute(user);
  }
}
