## 1. Banco de dados (Prisma)

- [x] 1.1 Criar model `Post` (`id`, `title`, `body String?`, `imageUrl String?`, `imageKey String?`, `videoUrl String?`, `isPublic Boolean @default(true)`, `pinned Boolean @default(false)`, `publishedAt`, `crunchId`, `authorId`, `@@index([crunchId, isPublic, publishedAt])`) com relações em `Crunch` e `User`
- [x] 1.2 Adicionar colunas de rodapé em `Crunch`: `phone`, `whatsapp`, `email`, `instagram`, `facebook`, `youtube`, `website` (todas `String?`)
- [x] 1.3 Migration aditiva escrita (`20260803140000_church_posts_and_footer`) + `prisma generate` ok; aplicar `migrate deploy` contra o Postgres real (banco local inacessível no ambiente do agente)

## 2. Backend: upload de imagem

- [x] 2.1 Endpoint `POST /api/church/uploads/image` (multipart) validando mimetype `image/jpeg|png|webp` e tamanho máx. 5 MB, salvando em `uploads/` e retornando `{ url, key, fileName, mimeType, size }`
- [x] 2.2 Autorizar o upload por `hasPermission(user, "CONTENT_PUBLISH")` (ou pastor/admin)

## 3. Backend: CRUD de Publicações

- [x] 3.1 Criar `postAdapters.ts` com `getCurrentUser` (contexto + `roles`) e `assertCanPublish` via `hasPermission(user, "CONTENT_PUBLISH")`
- [x] 3.2 `listPosts` (da igreja ativa, ordenado por `pinned` e `publishedAt`), `createPost`, `updatePost`, `deletePost` (validar título; aceitar `imageUrl`/`imageKey`/`videoUrl`/`isPublic`/`pinned`)
- [x] 3.3 Criar `PostRoutes.ts` (`GET/POST/PATCH/DELETE /api/church/posts`) e registrar em `server.ts`

## 4. Backend: rodapé + rota pública

- [x] 4.1 `UpdateCrunch` (use-case/service) aceitar e persistir `phone`, `whatsapp`, `email`, `instagram`, `facebook`, `youtube`, `website` (validação leve de link)
- [x] 4.2 `publicChurchAdapters.getChurch` devolver `posts` públicos (isPublic, ordenados) e um objeto `footer` (endereço + contatos + redes preenchidas)

## 5. Frontend: composables e cadastro mínimo

- [x] 5.1 `usePosts.ts`: `listPosts`, `createPost`, `updatePost`, `deletePost` e `uploadImage` (multipart)
- [x] 5.2 Seção "Publicações" mínima e funcional no `admin.vue`: listar, criar (título, texto, upload de foto, link de vídeo, toggle "aparece na página"), editar, excluir
- [x] 5.3 Campos de rodapé (contatos + redes) no formulário de dados da igreja no admin (`useChurch`/update)

## 6. Validação

- [x] 6.1 `npm run validate` (lint + typecheck + testes + web build) verde
- [ ] 6.2 Teste manual (requer app + banco): criar publicação com foto e vídeo, marcar como pública, conferir na rota pública; salvar contatos/redes e conferir no `footer` da rota pública
