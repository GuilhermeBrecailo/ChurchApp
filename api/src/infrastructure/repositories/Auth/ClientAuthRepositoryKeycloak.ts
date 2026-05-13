import {
  AuthTokenDto,
  IClientAuthRepository,
} from "../../../domain/repositories/Auth/IClientAuthRepository";
import { $fetch } from "ofetch";
import { $config } from "../.././../../config/config";
import { DomainError } from "../../../domain/value-objects/utils/DomainError";
import { DomainToken } from "../../../domain/value-objects/utils/DomainToken";

export default class ClientAuthRepositoryKeycloak implements IClientAuthRepository {
  private async generateMasterToken(): Promise<void> {
    try {
      if (
        !$config.KEYCLOAK_CLIENT_ID ||
        !$config.KEYCLOAK_GRANT_TYPE ||
        !$config.KEYCLOAK_USER ||
        !$config.KEYCLOAK_SECRET_KEY ||
        !$config.KEYCLOAK_PASSWORD
      ) {
        throw new Error("Configuração Keycloak incompleta");
      }

      const body = new URLSearchParams({
        client_id: $config.KEYCLOAK_CLIENT_ID,
        grant_type: $config.KEYCLOAK_GRANT_TYPE,
        username: $config.KEYCLOAK_USER,
        password: $config.KEYCLOAK_PASSWORD,
        client_secret: $config.KEYCLOAK_SECRET_KEY,
      }).toString();

      const { access_token } = await $fetch(
        `${$config.KEYCLOAK_ENDPOINT_BASE}/realms/master/protocol/openid-connect/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body,
        },
      );

      if (!access_token) throw new Error("Falha ao acessar o acess_token");
      return access_token;
    } catch (err) {
      console.error("Erro ao criar Realm:", err);
      throw new Error("Falha ao gerar o token");
    }
  }
  public async createSecretApi(
    clientUUID: string,
  ): Promise<{ secret: string }> {
    const access_token = await this.generateMasterToken();

    try {
      const clientSecretResponse = await $fetch(
        `${$config.KEYCLOAK_ENDPOINT_BASE}/admin/realms/${$config.KEYCLOAK_REALM}/clients/${clientUUID}/client-secret`,
        {
          headers: { Authorization: `Bearer ${access_token}` },
          method: "GET",
        },
      );

      const clientSecret = clientSecretResponse.value;

      return { secret: clientSecret };
    } catch (err) {
      console.error("Erro ao criar secret API:", err);
      throw new Error("Falha ao criar secret API");
    }
  }
  public async createConsumerApi(
    email: string,
    tenant_id: string,
  ): Promise<{ client_id: string; secret: string }> {
    const access_token = await this.generateMasterToken();

    try {
      const clientId = "API-" + email;

      const response = await $fetch.raw(
        `${$config.KEYCLOAK_ENDPOINT_BASE}/admin/realms/${$config.KEYCLOAK_REALM}/clients`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: {
            clientId: clientId,
            enabled: true,
            publicClient: false, // precisa ser false para usar client_credentials
            protocol: "openid-connect",
            serviceAccountsEnabled: true, // ativa conta de serviço para client_credentials
            authorizationServicesEnabled: true, // habilita fine-grained authorization
            directAccessGrantsEnabled: false, // não precisa de password flow
            standardFlowEnabled: false, // desabilita code flow
            implicitFlowEnabled: false, // desabilita implicit
            redirectUris: [],
            webOrigins: [],
            protocolMappers: [
              {
                name: "tenant_id-" + tenant_id,
                protocol: "openid-connect",
                protocolMapper: "oidc-hardcoded-claim-mapper",
                consentRequired: false,
                config: {
                  "claim.name": "tenant_id",
                  "claim.value": tenant_id,
                  "jsonType.label": "String",
                  "id.token.claim": "true",
                  "access.token.claim": "true",
                  "userinfo.token.claim": "true",
                },
              },
            ],
          },
        },
      );

      const location = response.headers.get("location");
      const consumerId = location?.split("/").pop() as string;

      const { secret } = await this.createSecretApi(consumerId);

      if (!consumerId || !secret)
        throw new Error("Falha ao criar consumer API");

      return { client_id: clientId, secret: secret };
    } catch (err) {
      console.error("Erro ao criar Consumer:", err);
      throw new Error("Falha ao criar Consumer API");
    }
  }
  public async createNewUser(
    email: string,
    password: string,
    tenant_id: string,
    name: string,
  ): Promise<{
    group_id: string;
    scope_id: string;
    user_id: string;
  }> {
    const attributes: Record<string, string[]> = {};
    attributes["tenant_id"] = [tenant_id];

    const { group_id } = await this.createGroups(tenant_id, attributes);

    const { id: scope_id } = await this.createScopes(tenant_id);
    await this.setScope(scope_id);
    await this.createMapperUser(scope_id, "tenant_id");
    const { user_id } = await this.createInternalUser(
      email,
      password,
      attributes,
      name,
    );
    await this.addUserIntoGroup(user_id, group_id);

    return {
      group_id,
      scope_id,
      user_id,
    };
  }
  public async updateUser(
    user_id: string,
    email: string,
    name: string,
  ): Promise<void> {
    try {
      const access_token = await this.generateMasterToken();

      const nameFull = name.trim();

      const partes = nameFull.split(" ");

      const firstName = partes[0];
      const lastName = partes.slice(1).join(" ");

      const updatedData = {
        email: email,
        firstName: firstName,
        lastName: lastName || "sobrenome",
      };

      // 3. Atualiza os dados do usuário
      await $fetch(
        `${$config.KEYCLOAK_ENDPOINT_BASE}/admin/realms/${$config.KEYCLOAK_REALM}/users/${user_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          body: updatedData,
        },
      );
    } catch (err) {
      console.error("Erro ao criar Client:", err);
      throw new Error("Falha ao criar Client");
    }
  }
  public async updatePasswordUser(
    user_id: string,
    password: string,
  ): Promise<void> {
    try {
      const access_token = await this.generateMasterToken();

      // 3. Atualiza os dados do usuário
      await $fetch(
        `${$config.KEYCLOAK_ENDPOINT_BASE}/admin/realms/${$config.KEYCLOAK_REALM}/users/${user_id}/reset-password`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          body: {
            type: "password",
            value: password,
            temporary: false,
          },
        },
      );
    } catch (err) {
      console.error("Erro ao criar Client:", err);
      throw new Error("Falha ao criar Client");
    }
  }
  public async createInternalUser(
    email: string,
    password: string,
    attributes: Record<string, string[]>,
    name: string,
  ): Promise<{ user_id: string }> {
    const access_token = await this.generateMasterToken();

    const nameFull = name.trim();

    const partes = nameFull.split(" ");

    const firstName = partes[0];
    const lastName = partes.slice(1).join(" ");

    try {
      const result = await $fetch.raw(
        `${$config.KEYCLOAK_ENDPOINT_BASE}/admin/realms/${$config.KEYCLOAK_REALM}/users`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
          method: "POST",
          body: {
            username: email,
            email: email,
            firstName: firstName,
            lastName: lastName || "sobrenome",
            enabled: true,
            attributes,
            credentials: [
              {
                type: "password",
                value: password,
                temporary: false,
              },
            ],
          },
        },
      );

      const location = result.headers.get("location");
      const user_id = location?.split("/").pop();

      if (!user_id) {
        throw new Error("Falha ao acessar os dados do usuario");
      }

      return { user_id };
    } catch (err) {
      console.error("Erro ao criar Client:", err);
      throw new Error("Falha ao criar Client");
    }
  }
  public async createGroups(
    groupName: string,
    attributes: Record<string, string[]>,
  ): Promise<{ group_id: string }> {
    const access_token = await this.generateMasterToken();

    try {
      const response = await $fetch.raw(
        `${$config.KEYCLOAK_ENDPOINT_BASE}/admin/realms/${$config.KEYCLOAK_REALM}/groups`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: {
            name: groupName,
            attributes: attributes,
          },
        },
      );
      const location = response.headers.get("location");
      const groupId = location?.split("/").pop();

      if (!groupId) throw Error("Falha ao criar o grupo");

      return { group_id: groupId };
    } catch (err) {
      console.error("Falha ao criar o grupo:", err);
      throw new DomainError("Falha ao criar o grupo");
    }
  }
  public async createScopes(name: string): Promise<{ id: string }> {
    const access_token = await this.generateMasterToken();
    try {
      const response = await $fetch.raw(
        `${$config.KEYCLOAK_ENDPOINT_BASE}/admin/realms/${$config.KEYCLOAK_REALM}/client-scopes`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: {
            name,
            protocol: "openid-connect",
          },
        },
      );

      const location = response.headers.get("location");
      const scopeId = location?.split("/").pop();

      if (!scopeId) throw new DomainError("Falha ao criar o Cliente scope");

      return { id: scopeId };
    } catch (err) {
      console.error("Falha ao criar o Cliente scope:", err);
      throw new DomainError("Falha ao criar o Cliente scope");
    }
  }
  public async setScope(scopeId: string): Promise<void> {
    const access_token = await this.generateMasterToken();
    try {
      await $fetch(
        `${$config.KEYCLOAK_ENDPOINT_BASE}/admin/realms/${$config.KEYCLOAK_REALM}/clients/${$config.KEYCLOAK_CLIENT_UUID}/default-client-scopes/${scopeId}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
          method: "PUT",
        },
      );
    } catch (err) {
      console.error("Falha ao salvar scopo consumer:", err);
      throw new DomainError("Falha ao salvar scopo consumer");
    }
  }
  public async addUserIntoGroup(
    userId: string,
    groupId: string,
  ): Promise<void> {
    const access_token = await this.generateMasterToken();
    try {
      await $fetch(
        `${$config.KEYCLOAK_ENDPOINT_BASE}/admin/realms/${$config.KEYCLOAK_REALM}/users/${userId}/groups/${groupId}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          method: "PUT",
          body: {},
        },
      );
    } catch (err) {
      console.error("Falha ao vincular usuario ao grupo:", err);
      throw new DomainError("Falha ao vincular usuario ao grupo");
    }
  }
  public async createMapperUser(
    scopeId: string,
    attribute_name: string,
  ): Promise<void> {
    const access_token = await this.generateMasterToken();
    try {
      await $fetch(
        `${$config.KEYCLOAK_ENDPOINT_BASE}/admin/realms/${$config.KEYCLOAK_REALM}/client-scopes/${scopeId}/protocol-mappers/models`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: {
            name: attribute_name,
            protocol: "openid-connect",
            protocolMapper: "oidc-usermodel-attribute-mapper",
            config: {
              "user.attribute": attribute_name,
              "claim.name": attribute_name,
              "jsonType.label": "String",
              "id.token.claim": "true",
              "access.token.claim": "true",
              "userinfo.token.claim": "true",
            },
          },
        },
      );
    } catch (err) {
      console.error("Falha ao criar mapper contractor:", err);
      throw new DomainError("Falha ao criar mapper contractor");
    }
  }
  public async login(email: string, password: string): Promise<AuthTokenDto> {
    try {
      const params = new URLSearchParams();
      params.append("client_id", $config.KEYCLOAK_CLIENT_USER_ID);
      params.append("grant_type", "password");
      params.append("username", email);
      params.append("password", password);

      const result = await $fetch(
        `${$config.KEYCLOAK_ENDPOINT_BASE}/realms/${$config.KEYCLOAK_REALM}/protocol/openid-connect/token`,
        {
          method: "POST",
          body: params,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );
      if (!result || !result?.access_token)
        throw new DomainError("Dados invalidos para login");
      return result as AuthTokenDto;
    } catch (err) {
      console.error("Falha ao fazer login:", err);
      throw new DomainError("Verifique os dados e tente novamente");
    }
  }
  public async loginApi(
    client_id: string,
    client_secret: string,
  ): Promise<AuthTokenDto> {
    try {
      const params = new URLSearchParams();
      params.append("client_id", client_id);
      params.append("grant_type", "client_credentials");
      params.append("client_secret", client_secret);

      const result = await $fetch(
        `${$config.KEYCLOAK_ENDPOINT_BASE}/realms/${$config.KEYCLOAK_REALM}/protocol/openid-connect/token`,
        {
          method: "POST",
          body: params,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );
      if (!result || !result?.access_token)
        throw new DomainError("Credenciais invalidas para acesso");
      return result as AuthTokenDto;
    } catch (err) {
      console.error("Falha ao fazer login:", err);
      throw new DomainError(
        "Falha ao fazer login, verifique os dados e tente novamente",
      );
    }
  }
  public async refreshToken(refresh_token: string): Promise<AuthTokenDto> {
    try {
      const params = new URLSearchParams();
      params.append("client_id", $config.KEYCLOAK_CLIENT_USER_ID);
      params.append("grant_type", "refresh_token");
      params.append("refresh_token", refresh_token);

      const result = await $fetch(
        `${$config.KEYCLOAK_ENDPOINT_BASE}/realms/${$config.KEYCLOAK_REALM}/protocol/openid-connect/token`,
        {
          method: "POST",
          body: params,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );
      if (!result || !result?.access_token)
        throw new DomainError("Credenciais invalidas para acesso");
      return result as AuthTokenDto;
    } catch (err) {
      console.error("Falha ao fazer login:", err);
      throw new DomainToken("Falha ao fazer Refresh token");
    }
  }
  public async regenerateSecretApi(
    clientId: string,
  ): Promise<{ secret: string }> {
    const access_token = await this.generateMasterToken();

    try {
      // 1. Buscar o UUID do client a partir do clientId
      const clients = await $fetch(
        `${$config.KEYCLOAK_ENDPOINT_BASE}/admin/realms/${$config.KEYCLOAK_REALM}/clients?clientId=${encodeURIComponent(clientId)}`,
        {
          headers: { Authorization: `Bearer ${access_token}` },
          method: "GET",
        },
      );

      if (!clients || clients.length === 0) {
        throw new Error(`Client com clientId "${clientId}" não encontrado`);
      }

      const clientUUID = clients[0].id;

      // 2. Regenerar secret (POST e não PUT)
      const clientSecretResponse = await $fetch(
        `${$config.KEYCLOAK_ENDPOINT_BASE}/admin/realms/${$config.KEYCLOAK_REALM}/clients/${clientUUID}/client-secret`,
        {
          headers: { Authorization: `Bearer ${access_token}` },
          method: "POST",
        },
      );

      const clientSecret = clientSecretResponse.value;

      return { secret: clientSecret };
    } catch (err) {
      console.error("Erro ao regenerar secret API:", err);
      throw new Error("Falha ao regenerar secret API");
    }
  }
}
