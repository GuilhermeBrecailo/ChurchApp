import { $prismaClient } from "../../../config/database";
import { ServiceTime } from "../../domain/entities/ServiceTime";
import { IServiceTimeRepository } from "../../domain/repositories/IServiceTimeRepository";
import { DomainError } from "../../domain/value-objects/utils/DomainError";

export class ServiceTimeRepository implements IServiceTimeRepository {
  private restore(row: { id: string; label: string; weekday: number; time: string; isActive: boolean; crunchId: string }) {
    return new ServiceTime(row);
  }

  async create(serviceTime: ServiceTime): Promise<ServiceTime> {
    const result = await $prismaClient.serviceTime.create({
      data: {
        id: serviceTime.id,
        label: serviceTime.label,
        weekday: serviceTime.weekday,
        time: serviceTime.time,
        isActive: serviceTime.isActive,
        crunchId: serviceTime.crunchId,
      },
    });
    return this.restore(result);
  }

  async findByIdAndCrunchId(id: string, crunchId: string): Promise<ServiceTime | null> {
    const result = await $prismaClient.serviceTime.findFirst({ where: { id, crunchId } });
    return result ? this.restore(result) : null;
  }

  async findByCrunchId(crunchId: string, onlyActive = false): Promise<ServiceTime[]> {
    const results = await $prismaClient.serviceTime.findMany({
      where: { crunchId, ...(onlyActive ? { isActive: true } : {}) },
      orderBy: [{ weekday: "asc" }, { time: "asc" }],
    });
    return results.map((result) => this.restore(result));
  }

  async update(serviceTime: ServiceTime): Promise<ServiceTime> {
    try {
      const result = await $prismaClient.serviceTime.update({
        where: { id: serviceTime.id },
        data: {
          label: serviceTime.label,
          weekday: serviceTime.weekday,
          time: serviceTime.time,
          isActive: serviceTime.isActive,
        },
      });
      return this.restore(result);
    } catch (error) {
      console.error("Falha ao atualizar horario de culto", error);
      throw new DomainError("Falha ao atualizar horario de culto");
    }
  }
}