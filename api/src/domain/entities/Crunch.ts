import { z } from "zod";
import { User, UserDTO } from "./User"; // Importando o DTO da classe User refatorada
import { Document } from "../value-objects/Document";
import { Address } from "../value-objects/Address";
import { Department } from "./Departament";

// 1. Schema de Validação
export const crunchSchema = z.object({
  id: z.string("Id não é válido").min(1, "Id não é válido"),

  name: z.string().trim().min(1, "Nome é obrigatório"),

  userMainId: z.string().trim().min(1, "Id do usuário principal é obrigatório"),

  logo: z.string().trim().min(1, "Logo é obrigatório"),

  isActive: z.boolean().default(false),
  createdAt: z.date().optional(),
});

export interface CrunchProps extends CrunchDTO {
  users?: User[];
  address?: Address;
  document?: Document;
  departaments?: Department[];
}

// 2. Tipo Inferido
export type CrunchDTO = z.infer<typeof crunchSchema>;

// 3. Entidade de Domínio
export class Crunch {
  private _id: string;
  private _name: string;
  private _userMainId: string;
  private _logo: string;
  private _isActive: boolean;
  private _createdAt: Date;

  private _departaments: Department[];
  private _users: User[];
  private _address?: Address;
  private _document?: Document;

  private constructor(props: CrunchProps) {
    this._id = props.id;
    this._name = props.name;
    this._userMainId = props.userMainId;
    this._logo = props.logo;
    this._isActive = props.isActive;
    this._users = props.users ?? [];
    this._departaments = props.departaments ?? [];
    this._createdAt = props.createdAt || new Date();
    this._address = props.address;
    this._document = props.document;
  }

  // =================
  // FACTORIES (CREATE / RESTORE)
  // =================

  static create(
    props: Omit<CrunchDTO, "createdAt">,
    users: User[],
    address: Address,
    document: Document | undefined,
    departaments: Department[],
  ): Crunch {
    const data = crunchSchema.omit({ createdAt: true }).parse(props);
    return new Crunch({
      ...data,
      createdAt: new Date(),
      users,
      address,
      document,
      departaments, // Inicialmente sem departamentos, podem ser adicionados depois
    });
  }

  static restore(
    props: CrunchDTO,
    users: User[],
    address: Address,
    document: Document | undefined,
    departaments: Department[],
  ): Crunch {
    const data = crunchSchema.parse(props);

    if (!data.id) {
      throw new Error("Crunch (Igreja) precisa de ID");
    }

    return new Crunch({
      ...data,
      users,
      address,
      document,
      departaments,
    });
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

  get userMainId() {
    return this._userMainId;
  }

  get logo() {
    return this._logo;
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

  get address(): Address | undefined {
    return this._address;
  }

  get document(): Document | undefined {
    return this._document;
  }

  // =================
  // SETTERS
  // =================

  set name(value: string) {
    this._name = value;
  }

  set userMainId(value: string) {
    this._userMainId = value;
  }

  set logo(value: string) {
    this._logo = value;
  }

  set isActive(value: boolean) {
    this._isActive = value;
  }

  set users(value: UserDTO[]) {
    this._users = value.map((userDto) => User.restore(userDto));
  }

  set departaments(value: Department[]) {
    this._departaments = value;
  }

  set address(value: Address | undefined) {
    this._address = value;
  }

  set document(value: Document | undefined) {
    this._document = value;
  }
}
