# Infrastructure: Repositories

São as classes concretas que efetivamente implementam as interfaces (contratos) definidos lá na camada de Domínio (`domain/repositories`).

É aqui, e somente aqui, que as consultas SQL ou as chamadas da biblioteca do seu banco (como PrismaClient) devem acontecer.

- **Responsabilidade:** Interceptar e realizar a persistência de fato no servidor de banco de dados.
- **Exemplos no projeto:** `UserRepository.ts` (Nesta implementação concreta do contrato `IUserRepository`, injetamos o Prisma para criar de fato comandos `prisma.user.findMany()`, `prisma.user.create()`, etc), `CrunchRepository.ts`, `DepartamentRepository.ts`.
