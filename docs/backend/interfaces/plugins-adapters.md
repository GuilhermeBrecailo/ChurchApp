# Interfaces: Plugins e Adapters

Esta parte gerencia a conexão vitalícia dos pacotes do próprio Node.js à forma que o Fastify processa a informação durante a vida útil.

- **Plugins:** Configurações ou injetores de modificação do lifecycle das requisições (middlewares globais).
  - **Exemplos:** `KeycloakPlugin.ts` (verifica tokens de segurança), `TenantHandler.ts` (analisa e identifica o subdomínio/id do Tenant (Crunch) da empresa que está acessando e injeta na requisição HTTP), `FakeAuth.ts`.
- **Adapters:** Conversores simples de dados que adaptam tipos específicos recebidos do front-end/framework, normalizando os tipos para o domínio puro poder processar com segurança (ex: `userAdapters.ts`).
