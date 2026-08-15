import { Crunch } from "../../../domain/entities/Crunch";
import { ICrunchRepository } from "../../../domain/repositories/ICrunchRepository";

export class GetAllCrunchUseCase {
  constructor(private repository: ICrunchRepository) {}

  async execute(): Promise<Crunch[]> {
    const result = await this.repository.getAllCrunchs();
    return result;
  }
}
