import { z } from "zod";

export class TenantAuth {
  private data: TenantAuthType;

  constructor(payload: TenantAuthType) {
    this.data = TenantAuthSchema.parse(payload); // valida na criação
  }

  // Getters
  get groupId(): string {
    return this.data.group_id;
  }

  get scopeId(): string {
    return this.data.scope_id;
  }

  get userId(): string {
    return this.data.user_id;
  }

  get clientId(): string {
    return this.data.client_id;
  }

  get secret(): string {
    return this.data.secret;
  }

  // Setters com validação automática
  set groupId(value: string) {
    this.data.group_id = TenantAuthSchema.shape.group_id.parse(value);
  }

  set scopeId(value: string) {
    this.data.scope_id = TenantAuthSchema.shape.scope_id.parse(value);
  }

  set userId(value: string) {
    this.data.user_id = TenantAuthSchema.shape.user_id.parse(value);
  }

  set clientId(value: string) {
    this.data.client_id = TenantAuthSchema.shape.client_id.parse(value);
  }

  set secret(value: string) {
    this.data.secret = TenantAuthSchema.shape.secret.parse(value);
  }
}

export const TenantAuthSchema = z.object({
  group_id: z.string().uuid("group_id invalido"),
  scope_id: z.string().uuid("scope_id invalido"),
  user_id: z.string().uuid("user_id invalido"),
  client_id: z.string().min(5),
  secret: z.string().min(10),
});

export type TenantAuthType = z.infer<typeof TenantAuthSchema>;
