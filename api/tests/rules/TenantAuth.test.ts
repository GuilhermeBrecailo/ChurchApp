import { TenantAuth } from "../../src/domain/entities/tenant/TenantAuth";

const validTenantAuthProps = {
  group_id: "550e8400-e29b-41d4-a716-446655440000",
  scope_id: "550e8400-e29b-41d4-a716-446655440001",
  user_id: "550e8400-e29b-41d4-a716-446655440002",
  client_id: "client-api",
  secret: "secret-value",
};

describe("TenantAuth Entity", () => {
  it("Deve criar uma autenticação de tenant válida", () => {
    const tenantAuth = new TenantAuth(validTenantAuthProps);

    expect(tenantAuth.groupId).toBe(validTenantAuthProps.group_id);
    expect(tenantAuth.scopeId).toBe(validTenantAuthProps.scope_id);
    expect(tenantAuth.userId).toBe(validTenantAuthProps.user_id);
    expect(tenantAuth.clientId).toBe(validTenantAuthProps.client_id);
    expect(tenantAuth.secret).toBe(validTenantAuthProps.secret);
  });

  it("Deve atualizar propriedades pelos setters com validação", () => {
    const tenantAuth = new TenantAuth(validTenantAuthProps);

    tenantAuth.groupId = "550e8400-e29b-41d4-a716-446655440003";
    tenantAuth.scopeId = "550e8400-e29b-41d4-a716-446655440004";
    tenantAuth.userId = "550e8400-e29b-41d4-a716-446655440005";
    tenantAuth.clientId = "client-updated";
    tenantAuth.secret = "updated-secret";

    expect(tenantAuth.groupId).toBe("550e8400-e29b-41d4-a716-446655440003");
    expect(tenantAuth.scopeId).toBe("550e8400-e29b-41d4-a716-446655440004");
    expect(tenantAuth.userId).toBe("550e8400-e29b-41d4-a716-446655440005");
    expect(tenantAuth.clientId).toBe("client-updated");
    expect(tenantAuth.secret).toBe("updated-secret");
  });

  it("Deve lançar erro se group_id for inválido", () => {
    expect(() => {
      new TenantAuth({
        ...validTenantAuthProps,
        group_id: "group_invalido",
      });
    }).toThrow(/group_id invalido/);
  });

  it("Deve lançar erro se scope_id for inválido", () => {
    expect(() => {
      new TenantAuth({
        ...validTenantAuthProps,
        scope_id: "scope_invalido",
      });
    }).toThrow(/scope_id invalido/);
  });

  it("Deve lançar erro se user_id for inválido", () => {
    expect(() => {
      new TenantAuth({
        ...validTenantAuthProps,
        user_id: "user_invalido",
      });
    }).toThrow(/user_id invalido/);
  });

  it("Deve lançar erro se client_id for curto", () => {
    expect(() => {
      new TenantAuth({
        ...validTenantAuthProps,
        client_id: "api",
      });
    }).toThrow();
  });

  it("Deve lançar erro se secret for curto", () => {
    expect(() => {
      new TenantAuth({
        ...validTenantAuthProps,
        secret: "short",
      });
    }).toThrow();
  });
});
