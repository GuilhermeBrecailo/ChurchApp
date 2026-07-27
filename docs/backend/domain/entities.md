# Domain: Entities

Define as estruturas de dados centrais do seu negócio e suas regras fundamentais. Uma entidade possui uma identidade única e um ciclo de vida.

- **Responsabilidade:** Representar o estado e o comportamento principal do negócio (ex: um usuário não pode ser instanciado sem nome válido).
- **Exemplos no projeto:** `User.ts`, `Departament.ts`, `Crunch.ts`, `ServiceTime.ts`.
- **Detalhe:** A entidade `User`, por exemplo, usa validação de schema (`userSchema` via Zod) e possui uma classe de domínio que encapsula essas propriedades. Ela fornece métodos estáticos (como `create()` e `restore()`) para garantir que dados inconsistentes nunca ganhem vida dentro do sistema.
- **`ServiceTime`:** representa um horário recorrente de culto (`label`, `weekday`, `time`, `isActive`) vinculado a uma `Crunch`. É a base do cálculo de "próximos cultos" exibido na landing pública e no dashboard interno — não guarda ocorrências concretas, só a regra de recorrência.
- **`Crunch`** ganhou `slug` (identificador público único, usado na URL `/c/:slug`) e `accentColor` (cor de destaque opcional usada na landing).
- **`Announcement`** ganhou `isPublic` e `kind` (`ANNOUNCEMENT | PASTOR_MESSAGE | PRAYER`), controlando se o item aparece na landing pública da igreja e com qual rótulo.
- **`UserDepartmentMembership`** ganhou `canManageSchedule`, permitindo que o pastor ou o líder titular do ministério delegue a gestão de escala/repertório para outros membros do mesmo ministério.
