# Application: Services

Define contratos e lógica para interagir com serviços externos ou processos de infraestrutura, mantendo o nível de abstração seguro para a camada de aplicação não depender de detalhes de implementação (como bibliotecas específicas).

- **Responsabilidade:** Ser contratos (interfaces) para orquestração de provedores ou rotinas externas.
- **Exemplos no projeto:** `IIdentityProvider.ts` (Interface genérica para um serviço de autenticação ou identidade, que pode ser o Keycloak hoje, e outro amanhã).
