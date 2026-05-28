# Interfaces: Controllers

Os Controladores (Controllers) são a verdadeira porta de comunicação entre o framework HTTP e as orquestrações abstraídas da aplicação.

- **Responsabilidade:**
  1. Receber requisições e capturar parâmetros (`body`, `query`, `params`).
  2. Instanciar (ou receber) os casos de uso (`Use Case`) corretos para aquela rota.
  3. Tratar as respostas de negócio e devolver formatações corretas HTTP (Ex: HTTP 200, 201 ou retornar erro amigável 400).
- **Exemplos no projeto:** `UserController.ts`, `CrunchController.ts`, `DepartamentControllers.ts` e o arquivo referencial geral `Handler.ts`.
