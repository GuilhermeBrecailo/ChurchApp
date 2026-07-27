import { IServiceTimeRepository } from "../../../domain/repositories/IServiceTimeRepository";
import { DomainError } from "../../../domain/value-objects/utils/DomainError";

export type UpdateServiceTimeInput = {
  id: string;
  crunchId: string;
  label?: string;
  weekday?: number;
  time?: string;
  isActive?: boolean;
};

export class UpdateServiceTimeUseCase {
  constructor(private repository: IServiceTimeRepository) {}

  async execute(input: UpdateServiceTimeInput) {
    const serviceTime = await this.repository.findByIdAndCrunchId(input.id, input.crunchId);
    if (!serviceTime) {
      throw new DomainError("Horario de culto nao encontrado");
    }

    if (input.label !== undefined) serviceTime.label = input.label;
    if (input.weekday !== undefined) serviceTime.weekday = input.weekday;
    if (input.time !== undefined) serviceTime.time = input.time;
    if (input.isActive !== undefined) serviceTime.isActive = input.isActive;

    return await this.repository.update(serviceTime);
  }
}