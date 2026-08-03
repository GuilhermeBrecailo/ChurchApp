## 1. Backend

- [ ] 1.1 Garantir `isPublic` (toggle "aparece na página") na criação/edição de versículo do dia e devocional, se ainda não houver de forma consistente
- [ ] 1.2 Confirmar endpoints de exclusão para todos os tipos (aviso, versículo, devocional, publicação, horário); criar o que faltar
- [ ] 1.3 Endpoint(s) de listagem que a tela precise (a maioria já existe)

## 2. Frontend

- [ ] 2.1 Nova tela/aba de Conteúdo com seletor "O que você quer publicar?" (aviso, versículo, devocional, publicação, horário)
- [ ] 2.2 Formulário certo por tipo, reaproveitando `useDailyVerse`/`useAnnouncements`/`useDevotionals`/`usePosts`/`useServiceTimes`
- [ ] 2.3 Toggle "Aparecer na página pública" consistente em todos os tipos
- [ ] 2.4 Card de horários de culto (calendário da semana) incluído na tela
- [ ] 2.5 Lista unificada com filtro por tipo e status público/interno
- [ ] 2.6 Excluir com confirmação para todos os tipos
- [ ] 2.7 Estilo editorial (papel + cor da igreja + Fraunces), consistente com o já aplicado
- [ ] 2.8 **Corrigir layout no celular** — hoje a parte de "colocar na página" (formulário de publicação + toggle) fica quebrada no mobile; garantir empilhamento correto de campos/toggles/grades em telas estreitas (rever `content-admin-grid`, `footer-fields-grid`, `service-time-form`, upload de foto e switches)

## 3. Validação

- [ ] 3.1 `npm run validate` verde
- [ ] 3.2 Teste manual: publicar cada tipo, marcar/desmarcar público e conferir na página pública; excluir cada tipo
