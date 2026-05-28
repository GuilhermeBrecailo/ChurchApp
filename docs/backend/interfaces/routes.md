# Interfaces: Routes

A área de Rotas mapeia os endpoints HTTP.

- **Responsabilidade:** Indicar ao framework Web (neste caso FastAPI/Fastify) quais URLs, métodos (GET, POST, PATCH, DELETE) estão disponíveis, e redirecioná-los para o método certo no controller.
- **Exemplos no projeto:** `UserRoutes.ts` vincula (por exemplo) `POST /users` ao método `userController.create()`. Do mesmo modo em `DepartamentRoutes.ts`.
