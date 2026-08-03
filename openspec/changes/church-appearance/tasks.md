## 1. Banco de dados

- [x] 1.1 Colunas `textColor` e `fontFamily` em `Crunch`; migration aditiva (`20260803170000_church_appearance`) + `prisma generate`

## 2. Backend

- [x] 2.1 `updateOwnChurch` aceita `textColor`/`fontFamily`, validando `fontFamily` contra `ALLOWED_FONT_KEYS` (`api/src/domain/appearance.ts`)
- [x] 2.2 `GetPublicChurchBySlugUseCase`/`publicChurchAdapters` retornam `logo`, `accentColor`, `textColor`, `fontFamily`
- [x] 2.3 **Bug encontrado e corrigido**: `updateOwnChurch` tinha dois caminhos de código (a depender de `User.crunchId` estar preenchido ou não); o rodapé (telefone/WhatsApp/e-mail/redes) só era salvo em um deles — o outro ignorava esses campos silenciosamente. Corrigido para os dois caminhos salvarem rodapé e aparência.

## 3. Frontend

- [x] 3.1 Seção "Foto da igreja" no admin (upload + preview, reusa `uploadChurchPhoto`) — não existia nenhuma UI para isso antes
- [x] 3.2 Cor de destaque (já existia) + cor da letra (novo campo de cor) + seletor de estilo de fonte (4 opções curadas: Editorial/Fraunces, Elegante/Playfair Display, Moderna/Space Grotesk, Suave/Inter)
- [x] 3.3 Página pública aplica `--church-display` (fonte) e sobrescreve `--ink` (cor do texto) via variáveis CSS; todos os 11 usos de `"Fraunces"` no CSS trocados pela variável, então a troca de fonte cobre a página inteira
- [x] 3.4 Fontes restritas a uma lista curada carregada no `<link>` de Google Fonts do app (Fraunces, IBM Plex Mono, Inter já existiam; adicionadas Playfair Display e Space Grotesk) — sem fonte arbitrária, sem novo host externo

## 4. Validação

- [x] 4.1 `npm run validate` verde (lint + typecheck + 107 testes + build)
- [ ] 4.2 Teste manual: trocar logo, cor do texto e fonte e ver refletido na página pública, legível em claro e escuro — requer app + banco
