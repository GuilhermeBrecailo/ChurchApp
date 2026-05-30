import { DomainError } from "../../../domain/value-objects/utils/DomainError";
import { TenantAuth } from "./TenantAuth";
import { z } from "zod";

export class Tenant {
  private data: TenantType;

  constructor(payload: TenantType) {
    //  valida tudo primeiro
    TenantSchema.parse({
      id: payload.id,
      email: payload.email,
      phone: payload.phone,
      name: payload.name,
      expiration: payload.expiration,
      is_verified: payload.is_verified,
      created_at: payload.created_at,
    });

    this.data = {
      id: payload.id,
      email: payload.email,
      phone: payload.phone,
      name: payload.name,
      auth: payload.auth,
      expiration: payload.expiration,
      is_verified: payload.is_verified,
      created_at: payload.created_at,
    };
  }

  // Getters
  get id(): string {
    return this.data.id;
  }
  get email(): string {
    return this.data.email;
  }
  get phone(): string {
    return this.data.phone;
  }

  get name(): string {
    return this.data.name;
  }
  get is_verified(): boolean {
    return this.data.is_verified;
  }

  get created_at() {
    return this.data.created_at;
  }

  // Setters (validam com o schema antes de setar)
  set email(value: string) {
    this.data.email = TenantSchema.shape.email.parse(value);
  }
  set is_verified(value: boolean) {
    this.data.is_verified = TenantSchema.shape.is_verified.parse(value);
  }

  set phone(value: string) {
    this.data.phone = TenantSchema.shape.phone.parse(value);
  }

  set name(value: string) {
    this.data.name = TenantSchema.shape.name.parse(value);
  }
  get auth(): TenantAuth {
    if (!this.data.auth) {
      throw new DomainError("A autenticação do tenant não foi inicializada.");
    }
    return this.data.auth;
  }

  set auth(value: TenantAuth) {
    this.data.auth = value;
  }

  get expiration(): Date {
    return this.data.expiration;
  }

  set expiration(value: Date) {
    this.data.expiration = TenantSchema.shape.expiration.parse(value);
  }
  isExpired(): boolean {
    const expirationTime = this.data.expiration.getTime();
    const now = Date.now();

    const TEN_DAYS_IN_MS = 10 * 24 * 60 * 60 * 1000; // Expirado = expiração + 10 dias < agora

    return now > expirationTime + TEN_DAYS_IN_MS;
  }
}

export const TenantSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email("Email inválido"),
  phone: z
    .string()
    .transform((val: string) => val.replace(/\D/g, ""))
    .refine(
      (val) => {
        return /^\d{10,11}$/.test(val);
      },
      {
        message: "Telefone deve conter DDD e ser válido",
      },
    )
    .transform((val) => {
      if (val.length === 11 && val[2] === "0") {
        return val[0] + val[1] + val.slice(3);
      }
      return val;
    }),
  name: z.string().min(3, "Nome muito curto").max(25, "Nome muito grande"),
  expiration: z.union([
    z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" })
      .transform((val) => new Date(val)),
    z.date(),
  ]),
  is_verified: z.boolean(),
  created_at: z.date().optional(),
});

type TenantTypeZod = z.infer<typeof TenantSchema>;

export type TenantType = TenantTypeZod & {
  auth?: TenantAuth;
};
