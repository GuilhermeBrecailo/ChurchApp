## Why

A página pública da igreja (`/c/:slug`) mostrava só listas de texto (cultos, avisos, versículos, devocionais) — sem fotos e sem rodapé, o que a deixava plana e "sem vida". A Fase 1 já entregou os dados (publicações com foto/vídeo e o rodapé); esta é a Fase 2: usar esses dados para dar à página um ponto visual forte e fechá-la com um rodapé de verdade.

## What Changes

- Nova seção **"Momentos da igreja"** (mural de publicações) logo após o herói: fotos com título, texto e vídeo, com a primeira publicação em destaque (layout maior) e as demais em grade. É a peça visual central da página.
- Novo **rodapé** da página pública: identidade da igreja, endereço com "Abrir no mapa", contatos clicáveis (WhatsApp, telefone, e-mail), ícones de redes sociais e um resumo dos horários de culto.
- O composable da landing (`useChurchLanding`) passa a expor `posts` e `footer`, consumindo `publicPosts` e `footer` da rota pública (entregues na Fase 1).
- Mantém o sistema visual existente (Fraunces + IBM Plex Mono + Inter, papel editorial dirigido pela cor da igreja); a mudança é aditiva e de acabamento, sem rebrand.

## Capabilities

### New Capabilities

- `public-page-experience`: Experiência visual da página pública — mural de publicações com foto/vídeo e rodapé com endereço, contatos, redes sociais e horários.

### Modified Capabilities

<!-- Nenhuma spec arquivada em openspec/specs; nada a modificar em nível de spec. -->

## Impact

- **Frontend (web)**: `useChurchLanding.ts` expõe `posts`/`footer`; `app/pages/c/[slug].vue` ganha a seção de mural e o rodapé, com CSS no mesmo sistema de tokens (mural, footer, responsivo, dark mode).
- **Backend**: nenhuma mudança — consome o que a Fase 1 (`church-posts-and-footer`) já entrega em `GET /public/church/:slug`.
