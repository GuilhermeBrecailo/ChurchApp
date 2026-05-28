# Domain: Entities

Define as estruturas de dados centrais do seu negócio e suas regras fundamentais. Uma entidade possui uma identidade única e um ciclo de vida.

- **Responsabilidade:** Representar o estado e o comportamento principal do negócio (ex: um usuário não pode ser instanciado sem nome válido).
- **Exemplos no projeto:** `User.ts`, `Departament.ts`, `Crunch.ts`.
- **Detalhe:** A entidade `User`, por exemplo, usa validação de schema (`userSchema` via Zod) e possui uma classe de domínio que encapsula essas propriedades. Ela fornece métodos estáticos (como `create()` e `restore()`) para garantir que dados inconsistentes nunca ganhem vida dentro do sistema.
