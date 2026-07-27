import crypto from "node:crypto";
import { ServiceTime } from "../../../domain/entities/ServiceTime";
import { IServiceTimeRepository } from "../../../domain/repositories/IServiceTimeRepository";

export type CreateServiceTimeInput = {
  label: string;
  weekday: number;
  time: string;
  isActive?: boolean;
  crunchId: string;
};

export class CreateServiceTimeUseCase {
  constructor(private repository: IServiceTimeRepository) {}

  async execute(input: CreateServiceTimeInput) {
    return await this.repository.create(
      new ServiceTime({
        id: crypto.randomUUID(),
        label: input.label,
        weekday: input.weekday,
        time: input.time,
        isActive: input.isActive ?? true,
        crunchId: input.crunchId,
      }),
    );
  }
}