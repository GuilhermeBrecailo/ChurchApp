## 1. Banco de dados

- [ ] 1.1 Adicionar `imageUrl`/`imageKey` em `Announcement` e `DailyVerse`; `videoUrl` em `Announcement` (Devotional e DailyVerse já têm videoUrl)
- [ ] 1.2 Migration aditiva + `prisma generate`

## 2. Backend

- [ ] 2.1 `announcementAdapters`, `devotionalAdapters`, `dailyVerseAdapters` aceitam/persistem `imageUrl`/`imageKey`/`videoUrl`
- [ ] 2.2 `publicChurchAdapters.getChurch` inclui os novos campos nesses conteúdos

## 3. Frontend

- [ ] 3.1 Upload de foto e campo de vídeo nos formulários de aviso, devocional e versículo (reusar `uploadImage`)
- [ ] 3.2 Página pública (`c/[slug].vue`) exibe foto/vídeo nesses itens

## 4. Validação

- [ ] 4.1 `npm run validate` verde
- [ ] 4.2 Teste manual: aviso/devocional/versículo com foto e vídeo aparecendo na página pública
