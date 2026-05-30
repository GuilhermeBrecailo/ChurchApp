import { z } from "zod";
import { Email } from "../value-objects/Email";

// 1. Schema de Validação
export const userSchema = z.object({
  id: z.string().min(1, "Id não é válido"),
  name: z.string().trim().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").trim(),
  phone: z.string().min(1, "Telefone é obrigatório").trim(),
  crunchId: z.string().min(1, "Igreja é obrigatório").trim().optional(),
  role: z.string().min(1, "Cargo é obrigatório").trim().optional(),
  createdAt: z.date().optional(),
});

// 2. Tipo Inferido
export type UserDTO = z.infer<typeof userSchema>;

// 3. Entidade de Domínio
export class User {
  private _id: string;
  private _name: string;
  private _email: Email;
  private _phone: string;
  private _crunchId?: string;
  private _role?: string;
  private _createdAt: Date;

  private constructor(props: UserDTO) {
    this._id = props.id;
    this._name = props.name;
    this._email = new Email(props.email);
    this._phone = props.phone;
    this._crunchId = props.crunchId;
    this._role = props.role;
    this._createdAt = props.createdAt || new Date();
  }

  // =================
  // FACTORIES (CREATE / RESTORE)
  // =================

  static create(props: Omit<UserDTO, "createdAt">): User {
    const data = userSchema.omit({ createdAt: true }).parse(props);
    return new User({ ...data, createdAt: new Date() });
  }

  static restore(props: UserDTO): User {
    const data = userSchema.parse(props);

    if (!data.id) {
      throw new Error("Usuário precisa de ID");
    }

    return new User(data);
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

  get email() {
    return this._email.getValue();
  }

  get phone() {
    return this._phone;
  }

  get crunchId() {
    return this._crunchId;
  }

  get role() {
    return this._role;
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

  set email(value: string) {
    this._email = new Email(value);
  }

  set phone(value: string) {
    this._phone = value;
  }

  set crunchId(value: string | undefined) {
    this._crunchId = value;
  }

  set role(value: string | undefined) {
    this._role = value;
  }
}
