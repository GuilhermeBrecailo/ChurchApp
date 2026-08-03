## 1. Implementação

- [x] 1.1 Card "Horários de culto" no `admin.vue` (form: dia + horário + nome; botões adicionar/editar/cancelar) na seção Página Pública, no estilo editorial
- [x] 1.2 Lista ordenada (`sortedServiceTimes`) com editar e desativar; marca inativos; helper `weekdayName`
- [x] 1.3 `loadServiceTimes()` incluído no carregamento do admin (`loadChurchAdminData`)
- [x] 1.4 CSS do formulário e da lista, responsivo

## 2. Validação

- [x] 2.1 `npm run validate` (lint + typecheck + testes + web build) verde
- [x] 2.2 Rotas confirmadas: `GET/POST/PATCH /api/church/service-times` (já existiam)
- [x] 2.3 Prévia estática atualizada com a tela de horários
- [ ] 2.4 Conferência visual/funcional no app real (cadastrar um horário e ver nos "Próximos cultos")
