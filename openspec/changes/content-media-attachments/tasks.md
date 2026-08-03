## 1. Banco de dados

- [x] 1.1 `imageUrl`/`imageKey` em `Announcement`, `DailyVerse` e `Devotional`; `videoUrl` em `Announcement` (Devotional/DailyVerse já tinham)
- [x] 1.2 Migration aditiva (`20260803160000_content_media_attachments`) + `prisma generate`

## 2. Backend

- [x] 2.1 `announcementAdapters` (create/update), `devotionalAdapters`, `dailyVerseAdapters` aceitam/persistem `imageUrl`/`imageKey`/`videoUrl`
- [x] 2.2 `publicChurchAdapters.getChurch` inclui os novos campos nos três conteúdos

## 3. Frontend

- [x] 3.1 Upload de foto + campo de vídeo nos 3 formulários (Versículo, Aviso, Devocional), via novo componente reutilizável `AdminMediaAttachmentFields` (usa o endpoint de upload já existente)
- [x] 3.2 Página pública (`c/[slug].vue`) exibe a foto (todos os 3 tipos) e o vídeo do aviso (versículo/devocional já exibiam vídeo antes)

## 4. Validação

- [x] 4.1 `npm run validate` verde (lint + typecheck + 107 testes + build)
- [ ] 4.2 Teste manual: aviso/devocional/versículo com foto e vídeo aparecendo na página pública — requer app + banco
