import { ICrunchRepository } from "../../../domain/repositories/ICrunchRepository";

export class DeleteCrunchUseCase {
  constructor(private repository: ICrunchRepository) {}

  async execute(id: string): Promise<void> {
    const result = await this.repository.deleteCrunch(id);
    return result;
  }
}
