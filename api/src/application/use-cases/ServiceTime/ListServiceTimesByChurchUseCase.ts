import { IServiceTimeRepository } from "../../../domain/repositories/IServiceTimeRepository";

export class ListServiceTimesByChurchUseCase {
  constructor(private repository: IServiceTimeRepository) {}

  async execute(crunchId: string, onlyActive = false) {
    return await this.repository.findByCrunchId(crunchId, onlyActive);
  }
}