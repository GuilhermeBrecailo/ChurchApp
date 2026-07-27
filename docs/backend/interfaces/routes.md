# Interfaces: Routes

A área de Rotas mapeia os endpoints HTTP.

- **Responsabilidade:** Indicar ao framework Web (neste caso FastAPI/Fastify) quais URLs, métodos (GET, POST, PATCH, DELETE) estão disponíveis, e redirecioná-los para o método certo no controller.
- **Exemplos no projeto:** `UserRoutes.ts` vincula (por exemplo) `POST /users` ao método `userController.create()`. Do mesmo modo em `DepartamentRoutes.ts`.
- **Rotas públicas:** qualquer path que comece literalmente com `/public/...` é liberado sem autenticação por `TenantHandler.ts` (`startsWith("/public")`). É o padrão usado pela landing pública da igreja: `PublicChurchRoutes.ts` expõe `GET /public/church/:slug`, `GET /public/church/:slug/service-times` e `POST`/`DELETE /public/church/:slug/notifications/subscribe` (inscrição push anônima, sem login). `ServiceTimeRoutes.ts` expõe o CRUD autenticado de horários de culto em `/api/church/service-times`.
