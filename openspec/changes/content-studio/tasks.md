## 0. Auditoria confirmada (estado real do código, verificado nesta sessão)

Estado atual, checado direto no código antes de escrever as tarefas abaixo:

- **Backend já tem `isPublic`** em `Announcement`, `DailyVerse` e `Devotional` (schema + adapters aceitam o campo). O que falta é só de UI.
- **UI de "aparecer na página" só existe no formulário de Aviso** (`announcementForm.isPublic` com switch). Os formulários de **Versículo** e **Devocional** no admin **não têm o toggle** e **não enviam `isPublic`** no payload (`publishDailyVerse`/`publishDevotional`) — ou seja, hoje versículo e devocional são sempre criados como não-públicos, sem forma de mudar isso pela tela.
- **Excluir**: `Announcement`, `Devotional` e `Post` já têm endpoint de exclusão (`deleteAnnouncement`, `deleteDevotional`, `deletePost`) e são usados no admin.
- **`DailyVerse` (versículo) não tem endpoint de exclusão nenhum** — nem rota, nem adapter. Precisa ser criado do zero.
- **`ServiceTime` (horário de culto) só tem "desativar"** (`deactivateServiceTime`, soft delete via `isActive=false`); não existe exclusão definitiva. Decidir se mantém só desativar ou também permite apagar.

## 1. Backend

- [ ] 1.1 Adicionar toggle funcional de `isPublic` no fluxo de versículo e devocional (o campo já existe no schema/adapter; falta só o front enviar)
- [ ] 1.2 Criar endpoint de exclusão para `DailyVerse` (rota + adapter; não existe hoje)
- [ ] 1.3 Decidir e, se necessário, implementar exclusão definitiva de `ServiceTime` (hoje só desativa)
- [ ] 1.4 Endpoint(s) de listagem que a tela precise (a maioria já existe)

## 2. Frontend

- [ ] 2.1 Nova tela/aba de Conteúdo com seletor "O que você quer publicar?" (aviso, versículo, devocional, publicação, horário)
- [ ] 2.2 Formulário certo por tipo, reaproveitando `useDailyVerse`/`useAnnouncements`/`useDevotionals`/`usePosts`/`useServiceTimes`
- [ ] 2.3 Adicionar o switch "Aparecer na página pública" nos formulários de Versículo e Devocional (só existe no de Aviso hoje) e garantir que todos os tipos enviem `isPublic` corretamente
- [ ] 2.4 Card de horários de culto (calendário da semana) incluído na tela
- [ ] 2.5 Lista unificada com filtro por tipo e status público/interno
- [ ] 2.6 Excluir com confirmação para todos os tipos, incluindo o botão de excluir versículo (depende da tarefa 1.2)
- [ ] 2.7 Estilo editorial (papel + cor da igreja + Fraunces), consistente com o já aplicado
- [ ] 2.8 **Corrigir layout no celular** — usuário relatou que a parte de "colocar na página" quebra no celular. Suspeitos concretos identificados no código: `.content-admin-grid`/`.footer-fields-grid` só empilham abaixo de 520px (telas um pouco maiores que isso ainda ficam em 2 colunas apertadas); o botão "Adicionar foto" + "Remover" da publicação fica em `d-flex` sem `flex-wrap`; o seletor de alcance do cargo (`v-btn-toggle` com `flex-1`) e as linhas de "adicionar cargo" (`v-select` + botão lado a lado, com `max-width` fixo em px) não têm regra de empilhar em telas estreitas. Revisar e testar em 375px e 390px de largura (iPhone SE/13 mini), não só no breakpoint de 520/720px já existente.

## 3. Validação

- [ ] 3.1 `npm run validate` verde
- [ ] 3.2 Teste manual: publicar cada tipo (incluindo marcar/desmarcar público em versículo e devocional) e conferir na página pública; excluir cada tipo, incluindo versículo
- [ ] 3.3 Teste manual em viewport de celular real (375–390px) da tela de conteúdo inteira, não só o formulário de publicação
