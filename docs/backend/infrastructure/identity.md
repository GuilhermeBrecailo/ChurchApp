# Infrastructure: Identity e Provedores

Implementações concretas dos serviços de provedor externo (como emails, identidades e storage) cujo contrato foi definido anteriormente na camada de Aplicação (`IIdentityProvider`).

- **Responsabilidade:** Executar e se comunicar com provedores terceirizados via protocolos HTTP (APIs externas).
- **Exemplos no projeto:**
  - `identity/KeycloakProvider.ts`: É o arquivo responsável por conectar a aplicação com a plataforma Keycloak.
  - `keycloack/index.ts`: Configurações de conexão para o keycloak.
