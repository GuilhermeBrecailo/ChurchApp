# Infrastructure: Database

Contém as configurações e esquemas específicos das tecnologias de banco de dados e persistência (o "como" os dados são efetivamente gravados e mapeados).

- **Responsabilidade:** Configurar e instanciar drivers de comunicação com o banco e definir a modelagem para o repositório.
- **Detalhe no projeto:** A pasta `database/prisma` contém seu schema do **Prisma ORM**, encarregado de criar tabelas, atualizar campos, etc. É dele que os arquivos concretos lêem as configurações do banco.
