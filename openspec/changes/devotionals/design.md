## Context

O app usa Nuxt 4 + Vuetify 4 no frontend e Fastify + Prisma no backend. A aba "Conteúdo" já existe com a página `pages/content/index.vue` linkando para `/content/devotionals`. O padrão de rotas do Nuxt 4 com `pages/content/devotionals.vue` (lista) e `pages/content/devotionals/[id].vue` (detalhe/leitor) segue a mesma convenção de `pages/ministery/index.vue` + `pages/ministery/[id].vue`.

## Goals / Non-Goals

**Goals:**
- Pastor/adm cria devocionais com capítulos em `/admin`
- Membros listam e leem devocionais em `/content/devotionals`
- Progresso de leitura (último capítulo) salvo por membro
- Capítulos têm título, texto rico e referência bíblica opcional

**Non-Goals:**
- Comentários dos membros nos capítulos
- Notificação push ao publicar devocional (v1)
- Agendamento de publicação
- Mídia (áudio/vídeo) nos capítulos

## Decisions

### 1. Três models: `Devotional`, `DevotionalChapter`, `DevotionalProgress`
Separação clara de responsabilidades. `Devotional` = série. `DevotionalChapter` = unidade de conteúdo com `order` para sequenciamento. `DevotionalProgress` = progresso individual, evita adicionar campo no `User`.

### 2. Texto do capítulo como `String` (não rich text/JSON)
Para v1, texto simples com quebras de linha. Não instalar editor rich text. Pode ser evoluído para `Json` com schema Tiptap/ProseMirror em versão futura.

**Alternativa descartada**: Campo `content: Json` com schema de editor — complexidade de parse no frontend desnecessária agora.

### 3. Rota `/content/devotionals/[id]` com tabs de capítulos
A página de detalhe usa `v-tabs` (um tab por capítulo) ou navegação anterior/próximo. Padrão simples alinhado com Vuetify já usado.

### 4. Progresso salvo automaticamente ao abrir o capítulo
`DevotionalProgress` é upserted via `PATCH /api/church/devotionals/:id/progress` quando o usuário abre um capítulo. Não requer ação do usuário.

## Risks / Trade-offs

- **Conteúdo longo**: Textos de capítulo podem ser extensos. `v-textarea` no admin deve ter `auto-grow`. No leitor, scroll normal.
- **Multi-tenant**: Devocionais filtrados por `crunchId` em todos os endpoints.

## Migration Plan

1. Adicionar models `Devotional`, `DevotionalChapter`, `DevotionalProgress` ao `schema.prisma`
2. Rodar `npx prisma migrate dev --name add-devotionals` dentro de `api/`
3. Implementar endpoints e adapters
4. Deploy backend e frontend
