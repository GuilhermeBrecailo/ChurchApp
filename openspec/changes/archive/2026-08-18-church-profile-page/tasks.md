## 1. Backend — Schema e Migration

- [ ] 1.1 Adicionar campo `schedule String?` ao model `Crunch` no schema Prisma para horários dos cultos em texto livre
- [ ] 1.2 Aplicar migration com `prisma migrate dev`

## 2. Backend — Endpoint Público

- [ ] 2.1 Criar `api/src/interfaces/adapters/publicAdapters.ts` com método `getChurchByInviteCode` que busca `Crunch` por `inviteCode` retornando name, logo, city, state, road, number, complement, schedule
- [ ] 2.2 Criar `api/src/interfaces/routes/PublicRoutes.ts` com `GET /api/public/church/:inviteCode` sem guard JWT
- [ ] 2.3 Registrar `PublicRoutes` em `server.ts` antes dos guards de autenticação

## 3. Backend — Admin: salvar horários

- [ ] 3.1 Atualizar endpoint de edição da igreja (admin) para aceitar e salvar o campo `schedule`

## 4. Frontend — Página Pública

- [ ] 4.1 Criar `web/app/pages/church/[inviteCode].vue` com layout público (sem AppBar/BottomNav da app)
- [ ] 4.2 Buscar dados via `GET /api/public/church/[inviteCode]` sem token de autenticação
- [ ] 4.3 Exibir logo, nome, endereço, horários (se cadastrados) e botão "Quero participar"
- [ ] 4.4 Botão redireciona para `/join?code=[inviteCode]`
- [ ] 4.5 Tratar erro 404 com mensagem "Igreja não encontrada"
- [ ] 4.6 Configurar middleware Nuxt para permitir acesso à rota `/church/*` sem autenticação

## 5. Frontend — Admin: campo de horários

- [ ] 5.1 Adicionar campo de texto "Horários dos cultos" nas configurações da igreja em `pages/admin.vue`
- [ ] 5.2 Salvar campo `schedule` ao atualizar dados da igreja
