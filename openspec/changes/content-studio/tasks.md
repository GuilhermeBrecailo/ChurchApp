## 0. Auditoria confirmada (estado real do código, verificado nesta sessão)

- **Backend já tinha `isPublic`** em `Announcement`, `DailyVerse` e `Devotional`. **Feito**: a UI de Versículo e Devocional agora enviam o campo.
- **Excluir**: `Announcement`, `Devotional`, `Post` e agora **`DailyVerse`** têm endpoint de exclusão e botão no admin.
- **`ServiceTime`**: trocado de "desativar" (soft) para **exclusão definitiva** (hard delete) via ícone de lixeira.
- **Bug real encontrado e corrigido**: o erro de qualquer ação (excluir, publicar) só aparecia num único alerta no topo da aba Conteúdo — se o usuário estava rolado para um card mais abaixo (Devocional, Publicações), o erro ficava fora da tela e parecia que "o botão não fazia nada". Cada card agora tem seu próprio alerta de erro logo acima do formulário.

## 1. Backend

- [x] 1.1 Toggle funcional de `isPublic` no fluxo de versículo e devocional
- [x] 1.2 Endpoint de exclusão para `DailyVerse` (rota + adapter, novo)
- [x] 1.3 Exclusão definitiva de `ServiceTime` (`DeleteServiceTimeUseCase` + rota `DELETE /api/church/service-times/:id`)
- [x] 1.4 Endpoint(s) de listagem que a tela precisa (já existiam: `listVerses`, `getAnnouncements`, `listDevotionals`, `listPosts`, `listServiceTimes`)

## 2. Frontend

- [x] 2.1 Nova tela/aba de Conteúdo com seletor "O que você quer publicar?" (aviso, versículo, devocional, publicação) — `web/app/pages/admin/publicacoes.vue` agora abre um card de seletor de tipo no topo e mostra só o formulário do tipo escolhido; horário de culto segue no card dedicado em Configurações (ver 2.4), fora do seletor
- [x] 2.3 Switch "Aparecer na página pública" em Versículo e Devocional (antes só existia em Aviso); todos os tipos publicáveis enviam `isPublic` corretamente
- [x] 2.4 Card de horários de culto já estava na seção Página Pública (feito em sessão anterior)
- [x] 2.5 Lista unificada com filtro por tipo e status público/interno — uma única lista no fim da tela, combinando aviso/versículo/devocional/publicação, com toggle de tipo e de público/interno
- [x] 2.6 Excluir com confirmação simples (sem modal) para todos os tipos, incluindo o versículo (era o gap principal)
- [x] 2.7 Estilo editorial já aplicado (sessão anterior)
- [x] 2.8 **Layout mobile corrigido**: grids de Conteúdo/rodapé trocados de breakpoint fixo (520px) para `auto-fit`/`minmax` (se adaptam a qualquer largura); linhas de "adicionar cargo" (select + botão) e do upload de foto ganharam `flex-wrap`; o seletor de alcance do cargo (`v-btn-toggle`) ganhou `display:flex; width:100%` para não desalinhar

## 3. Validação

- [x] 3.1 `npm run validate` verde (lint + typecheck + 107 testes + build)
- [ ] 3.2 Teste manual: publicar cada tipo (incluindo público/interno em versículo e devocional) e conferir na página pública; excluir cada tipo, incluindo versículo — requer app + banco
- [ ] 3.3 Teste manual em viewport de celular real (375–390px) — requer app rodando; as correções de CSS foram feitas por auditoria de código, não visualmente confirmadas no app real
