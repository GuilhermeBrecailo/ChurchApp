## Context

A página pública (`web/app/pages/c/[slug].vue`) é servida por `publicChurchAdapters.getChurch`, que hoje agrega `serviceTimes`, avisos públicos (`Announcement.isPublic`), versículos e devocionais públicos. Uploads de arquivo já existem para PDF em `churchDepartmentAdapters` (multipart via `@fastify/multipart`, disco em `api/uploads/`, servido por `fastifyStatic` a partir de `/uploads/...`; o DB guarda só metadados). A autorização de conteúdo de igreja passou a usar `hasPermission(user, "CONTENT_PUBLISH")` (cargo de igreja) após a mudança `scoped-role-permissions`. O `Crunch` já guarda endereço (city/road/state/zip/number/complement) e `logo`/`accentColor`, mas nenhum contato/rede social.

Esta é a Fase 1 de uma revisão em 3 fases: (1) dados+backend, (2) redesign da página pública, (3) redesign das telas de cadastro. Fase 1 só entrega dados, backend e um formulário mínimo funcional.

## Goals / Non-Goals

**Goals:**
- Tipo de conteúdo `Post` (foto + título + texto + vídeo) com visibilidade pública e fixação.
- Upload de imagem reaproveitando o padrão do PDF.
- CRUD autorizado por `CONTENT_PUBLISH`.
- Campos de rodapé no `Crunch` e no update da igreja.
- Rota pública devolvendo posts públicos + rodapé.

**Non-Goals:**
- Nada de visual/layout da página pública (Fase 2).
- Nada de redesign do formulário de cadastro (Fase 3); na Fase 1 o form é mínimo e funcional.
- Sem galeria de múltiplas fotos por post (uma foto por post).
- Sem upload de vídeo (vídeo é link YouTube/Instagram, como já é em versículo/devocional).
- Sem storage em nuvem (segue disco local no dev, contrato preservado).

## Decisions

### 1. `Post` como model próprio (não estender `Announcement`)
Decisão do usuário no brainstorming. Um model `Post` dedicado deixa a seção "Publicações" separada dos avisos curtos e evita poluir `Announcement` (que tem `kind`/`pinned` próprios do feed). Campos: `title`, `body String?`, `imageUrl String?`, `imageKey String?`, `videoUrl String?`, `isPublic Boolean @default(true)`, `pinned Boolean @default(false)`, `publishedAt`, `crunchId`, `authorId`, com `@@index([crunchId, isPublic, publishedAt])`.
- **Alternativa descartada**: reusar `Announcement` com foto/vídeo — mistura dois formatos de conteúdo na mesma tabela e na mesma seção pública.

### 2. Upload de imagem espelhando o de PDF
Novo endpoint `POST /api/church/uploads/image` no mesmo estilo do `uploadChurchDepartmentPdf`: lê `request.file()`, valida `mimetype ∈ {image/jpeg, image/png, image/webp}`, grava em `api/uploads/` com nome randômico, retorna `{ url, key, fileName, mimeType, size }`. A associação com o post é feita no create/update do post (o front sobe a imagem, recebe `url`/`key`, e envia no corpo do post).
- **Alternativa descartada**: base64 no corpo do JSON — incha payload e o DB; o padrão do projeto já é multipart + metadados.

### 3. Autorização por `CONTENT_PUBLISH`
Posts são conteúdo de igreja, então reusam a mesma regra de versículo/devocional: pastor/admin sempre, ou cargo de igreja com `CONTENT_PUBLISH`. O adapter monta `{ role, roles }` do contexto e chama `hasPermission`. O upload de imagem exige a mesma permissão (não faz sentido subir imagem sem poder publicar).
- **Alternativa descartada**: permissão nova só para posts — fragmenta o modelo de permissão recém-criado sem ganho real.

### 4. Rodapé como colunas no `Crunch`
Contatos e redes são dados de identidade da igreja, então ficam no próprio `Crunch` (não um model à parte): `phone`, `whatsapp`, `email`, `instagram`, `facebook`, `youtube`, `website`, todos `String?`. O update da igreja (`UpdateCrunch`) passa a aceitá-los; a rota pública devolve apenas os preenchidos.
- **Alternativa descartada**: model `ChurchContact`/`SocialLink[]` — over-engineering para um conjunto fixo e pequeno de campos.

## Risks / Trade-offs

- **Upload de imagem sem limite de tamanho vira abuso/disco cheio** → validar tamanho máximo (ex.: 5 MB) no handler, além do mimetype; o `@fastify/multipart` já permite limite de bytes.
- **Arquivos órfãos** quando um post é apagado ou a imagem trocada → aceitável na Fase 1 (disco local, dev); a limpeza de arquivos entra junto do storage em nuvem numa fase futura. Documentar.
- **Campos de rodapé livres (links) podem receber texto inválido** → validação leve de formato/URL no update; não bloquear salvamento por link mal formatado além do necessário.
- **Formulário mínimo pode parecer cru** → é intencional na Fase 1; o polimento é a Fase 3. Deixar funcional e completo, sem meia-boca no comportamento.

## Migration Plan

1. Prisma: criar `Post`; adicionar colunas de rodapé em `Crunch`.
2. `prisma migrate` (aditivo, sem data-fix) + `prisma generate`.
3. Backend: `postAdapters` + rotas; endpoint de upload de imagem; `publicChurchAdapters.getChurch` estendido; `UpdateCrunch` com os campos novos.
4. Frontend: `usePosts.ts`, seção mínima de Publicações no admin, campos de rodapé no form da igreja.
5. `npm run validate`.

**Rollback**: aditivo; reverter a migration ou `prisma migrate reset` no dev.

## Open Questions

- Nenhuma bloqueante. Limite de imagem fixado em 5 MB por padrão (ajustável).
