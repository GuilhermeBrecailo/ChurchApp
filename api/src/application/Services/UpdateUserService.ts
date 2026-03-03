import { User } from "../../domain/entities/User";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { GetUserByIdUseCase } from "../use-cases/GetUserByIdUseCase";
import { UpdateUserUseCase } from "../use-cases/UpdateUserUseCase";

export class UpdateUserService {
  constructor(
    private getUserByIdUseCase: GetUserByIdUseCase,
    private updateUserUseCase: UpdateUserUseCase,
  ) {}

  async handle(props: { id: string; name: string; email: string }) {
    const user = await this.getUserByIdUseCase.execute(props.id);
    if (!user || !user.getId()) {
      throw new DomainError("nao existe nenhum usuario com este ID");
    }

    user.setName(props.name);
    user.setEmail(props.email);

    await this.updateUserUseCase.execute(user);
  }
}
