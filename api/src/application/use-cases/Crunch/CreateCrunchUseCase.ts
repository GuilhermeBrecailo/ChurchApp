import { Crunch } from "../../../domain/entities/Crunch";
import { ICrunchRepository } from "../../../domain/repositories/ICrunchRepository";

export class CreateCrunchUseCase {
  constructor(private repository: ICrunchRepository) {}

  async execute(crunch: Crunch): Promise<{ id: string }> {
    const result = await this.repository.createCrunch(crunch);
    return result;
  }
}
