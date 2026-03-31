import { ICrunchRepository } from "../../../domain/repositories/ICrunchRepository";

export class UpdateCrunchUseCase {
  constructor(private repository: ICrunchRepository) {}

  async execute(crunch: {
    name: string;
    id: string;
    slug: string;
    isActive: boolean;
    createdAt: Date;
  }): Promise<void> {
    const result = await this.repository.updateCrunch(crunch);
    return result;
  }
}
