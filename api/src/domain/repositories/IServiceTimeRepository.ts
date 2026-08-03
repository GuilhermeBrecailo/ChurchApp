import { ServiceTime } from "../entities/ServiceTime";

export interface IServiceTimeRepository {
  create(serviceTime: ServiceTime): Promise<ServiceTime>;
  findByIdAndCrunchId(id: string, crunchId: string): Promise<ServiceTime | null>;
  findByCrunchId(crunchId: string, onlyActive?: boolean): Promise<ServiceTime[]>;
  update(serviceTime: ServiceTime): Promise<ServiceTime>;
  delete(id: string): Promise<void>;
}