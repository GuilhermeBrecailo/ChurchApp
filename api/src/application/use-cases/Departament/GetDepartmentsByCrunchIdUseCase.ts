import { Department } from "../../../domain/entities/Departament";
import { IDepartamentRepository } from "../../../domain/repositories/IDepartamentRepository";

export class GetDepartmentsByCrunchIdUseCase {
  constructor(private repository: IDepartamentRepository) {}

  async execute(crunchId: string): Promise<Department[]> {
    const result = await this.repository.getDepartmentsByCrunchId(crunchId);
    return result;
  }
}
