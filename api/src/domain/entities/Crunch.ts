import { z } from "zod";
import { UserDTO } from "./User"; // Importando o DTO da classe User refatorada
import { Document } from "../value-objects/Document";
import { Address } from "../value-objects/Address";
import { PastorMandate } from "../value-objects/PastorMandate";

// 1. Schema de Validação
export const crunchSchema = z.object({
  id: z.string().min(1, "Id não é válido"),
  name: z.string().min(1, "Nome é obrigatório").trim(),
  slug: z.string().min(1, "Slug é obrigatório").trim(),
  isActive: z.boolean().default(false),
  users: z.array(z.custom<UserDTO>()).optional().default([]),
  departaments: z.array(z.string()).optional().default([]),
  createdAt: z.date().optional(),
});

// 2. Tipo Inferido
export type CrunchDTO = z.infer<typeof crunchSchema>;

// 3. Entidade de Domínio
export class Crunch {
  private _id: string;
  private _name: string;
  private _document: Document;
  private _address: Address;
  private _userMain: string;
  private _logo: string;
  private _historypastoral: PastorMandate[];
  private _fundationDate: Date;
  private _type: string;
  private _parentId?: string;
  private _isActive: boolean;
  private _users: UserDTO[];
  private _departaments: string[];
  private _createdAt: Date;

  private constructor(props: CrunchDTO) {
    this._id = props.id;
    this._name = props.name;
    this._slug = props.slug;
    this._isActive = props.isActive;
    this._users = props.users ?? [];
    this._departaments = props.departaments ?? [];
    this._createdAt = props.createdAt || new Date();
  }

  // =================
  // FACTORIES (CREATE / RESTORE)
  // =================

  static create(props: Omit<CrunchDTO, "createdAt">): Crunch {
    const data = crunchSchema.omit({ createdAt: true }).parse(props);
    return new Crunch({ ...data, createdAt: new Date() });
  }

  static restore(props: CrunchDTO): Crunch {
    const data = crunchSchema.parse(props);

    if (!data.id) {
      throw new Error("Crunch (Igreja) precisa de ID");
    }

    return new Crunch(data);
  }

  // =================
  // GETTERS
  // =================

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  get isActive() {
    return this._isActive;
  }

  get users() {
    return this._users;
  }

  get departaments() {
    return this._departaments;
  }

  get createdAt() {
    return this._createdAt;
  }

  // =================
  // SETTERS
  // =================

  set name(value: string) {
    this._name = value;
  }

  set isActive(value: boolean) {
    this._isActive = value;
  }

  set users(value: UserDTO[]) {
    this._users = value;
  }

  set departaments(value: string[]) {
    this._departaments = value;
  }
}
