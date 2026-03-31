import { Crunch } from "../entities/Crunch";

export interface ICrunchRepository {
  createCrunch(crunch: Crunch): Promise<{ id: string }>;
  updateCrunch(crunch: Crunch): Promise<void>;
  deleteCrunch(id: string): Promise<void>;
  getAllCrunchs(): Promise<Crunch[]>;
  getCrunchById(id: string): Promise<Crunch>;
}
