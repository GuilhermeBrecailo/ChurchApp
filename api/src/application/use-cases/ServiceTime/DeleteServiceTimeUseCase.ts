import { IServiceTimeRepository } from "../../../domain/repositories/IServiceTimeRepository";
import { DomainError } from "../../../domain/value-objects/utils/DomainError";

export type DeleteServiceTimeInput = {
  id: string;
  crunchId: string;
};

export class DeleteServiceTimeUseCase {
  constructor(private repository: IServiceTimeRepository) {}

  async execute(input: DeleteServiceTimeInput) {
    const serviceTime = await this.repository.findByIdAndCrunchId(input.id, input.crunchId);
    if (!serviceTime) {
      throw new DomainError("Horario de culto nao encontrado");
    }

    await this.repository.delete(input.id);
    return { success: true };
  }
}
