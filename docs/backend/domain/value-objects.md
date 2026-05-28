# Domain: Value Objects

Representam conceitos do domínio que são definidos apenas pelo seu valor, sem identidade própria (dois e-mails "teste@teste.com" são a mesma coisa, enquanto duas pessoas com o mesmo nome são entidades diferentes).

Eles geralmente contêm validações de formato ou regras intrínsecas ao próprio valor.

- **Responsabilidade:** Validar e tipar informações de valor imutável.
- **Exemplos no projeto:** `Email.ts`, `CPF.ts`, `CEP.ts`, `Document.ts`.
- **Detalhe:** A entidade `User` utiliza o Value Object `Email` para garantir que o formato do email seja sempre válido dentro das regras da aplicação. Assim, no meio do código, nunca há dúvida se a string de email já foi validada ou não.
