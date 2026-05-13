export interface IClientAuthRepository {
  createConsumerApi(
    email: string,
    tenant_id: string,
  ): Promise<{ client_id: string; secret: string }>;
  createNewUser(
    email: string,
    password: string,
    tenant_id: string,
    name: string,
  ): Promise<{
    group_id: string;
    scope_id: string;
    user_id: string;
  }>;
  regenerateSecretApi(clientUUID: string): Promise<{ secret: string }>;
  updateUser(user_id: string, email: string, name: string): Promise<void>;
  updatePasswordUser(user_id: string, password: string): Promise<void>;
  login(email: string, password: string): Promise<AuthTokenDto>;
  loginApi(client_id: string, client_secret: string): Promise<AuthTokenDto>;
  refreshToken(refresh_token: string): Promise<AuthTokenDto>;
}
export interface AuthTokenDto {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  "not-before-policy": number;
  scope: string;
}
