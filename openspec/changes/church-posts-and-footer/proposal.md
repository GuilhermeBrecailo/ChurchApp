## Why

A página pública da igreja hoje só mostra cultos, avisos, versículos e devocionais — falta um jeito de publicar **fotos com título, texto e vídeo** (o conteúdo mais visual e compartilhável de uma igreja) e não há **rodapé** com contatos, redes sociais e endereço para o visitante saber como chegar ou falar com a igreja. Esta é a Fase 1 (dados + backend) de uma revisão maior da página pública; ela entrega a fundação que as fases visuais (2 e 3) vão consumir.

## What Changes

- Novo tipo de conteúdo **Publicação** (`Post`): foto (upload), título, texto, vídeo (link) e um controle "aparece na página pública?" (`isPublic`), com opção de fixar (`pinned`).
- Novo endpoint de **upload de imagem** (`POST /api/church/uploads/image`), reaproveitando a infra de disco/estático já usada nos PDFs; aceita JPEG/PNG/WebP.
- **CRUD de Publicações** autenticado (`/api/church/posts`), autorizado por pastor/admin ou pela permissão de cargo `CONTENT_PUBLISH`.
- **Campos de rodapé** na igreja (`Crunch`): `phone`, `whatsapp`, `email`, `instagram`, `facebook`, `youtube`, `website`; incluídos no update da igreja.
- A rota pública (`GET /api/public/church/:slug`) passa a devolver as **publicações públicas** e os **dados de rodapé** (contatos, redes, endereço), para a Fase 2 consumir.
- Formulário de cadastro de Publicação funcional (simples) no admin, para permitir criar e testar ponta a ponta já na Fase 1. O redesign visual do formulário fica para a Fase 3.

## Capabilities

### New Capabilities

- `church-posts`: Publicações da igreja (foto + título + texto + vídeo) com controle de visibilidade pública, incluindo upload de imagem, CRUD autorizado e exibição na rota pública.
- `church-public-footer`: Dados de rodapé da igreja (contatos, redes sociais, endereço) mantidos no cadastro da igreja e expostos na rota pública.

### Modified Capabilities

<!-- Nenhuma spec arquivada em openspec/specs; nada a modificar em nível de spec. -->

## Impact

- **Banco de dados (Prisma)**: novo model `Post` (`title`, `body`, `imageUrl`, `imageKey`, `videoUrl`, `isPublic`, `pinned`, `publishedAt`, `crunchId`, `authorId`); novas colunas em `Crunch` (`phone`, `whatsapp`, `email`, `instagram`, `facebook`, `youtube`, `website`). Migração aditiva, tudo opcional/com default.
- **Backend (api)**: `postAdapters.ts` + `PostRoutes.ts` (CRUD); endpoint de upload de imagem em `churchDepartmentAdapters` ou novo `uploadAdapters`; `publicChurchAdapters.getChurch` devolvendo posts públicos + rodapé; update de `Crunch` aceitando os campos novos; autorização via `hasPermission(..., "CONTENT_PUBLISH")`.
- **Frontend (web)**: `usePosts.ts` (CRUD + upload), seção mínima de Publicações no `admin.vue` para cadastrar/editar/excluir; `useChurch`/update da igreja com os campos de rodapé. O consumo público (página e rodapé) é da Fase 2.
- **Uploads**: imagens em `api/uploads/` servidas em `/uploads/...` no dev; mesmo contrato de metadados dos PDFs (trocar por S3/R2 em produção preserva o contrato).
