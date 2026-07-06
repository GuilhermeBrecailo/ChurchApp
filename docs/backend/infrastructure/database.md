# Infrastructure: Database

Contém as configurações e esquemas específicos das tecnologias de banco de dados e persistência (o "como" os dados são efetivamente gravados e mapeados).

- **Responsabilidade:** Configurar e instanciar drivers de comunicação com o banco e definir a modelagem para o repositório.
- **Detalhe no projeto:** A pasta `database/prisma` contém seu schema do **Prisma ORM**, encarregado de criar tabelas, atualizar campos, etc. É dele que os arquivos concretos lêem as configurações do banco.

## Prisma e deploy

- Toda alteração em `schema.prisma` que impacta o banco deve ter uma migration correspondente em `api/src/infrastructure/database/prisma/migrations`.
- O deploy de produção deve executar `npm --prefix api run prisma:deploy` antes de subir a versão da API.
- A validação local recomendada antes de publicar é:
  - `npm run api:typecheck`
  - `npm run api:test`
  - `npx prisma migrate diff --from-migrations api/src/infrastructure/database/prisma/migrations --to-schema api/src/infrastructure/database/prisma/schema.prisma --script`
- O comando de diff deve retornar saída vazia. Qualquer SQL retornado indica divergência entre migrations e schema.
