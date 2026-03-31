import { ICrunchRepository } from "../../../domain/repositories/ICrunchRepository";

export class GetCrunchByIdUseCase {
  constructor(private repository: ICrunchRepository) {}

  async execute(id: string): Promise<{
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: Date;
  }> {
    const result = await this.repository.getCrunchById(id);
    return result;
  }
}
