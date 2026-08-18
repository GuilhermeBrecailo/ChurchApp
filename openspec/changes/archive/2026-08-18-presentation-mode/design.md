## Context

O viewer de letra já existe em `scale.vue` como overlay fullscreen (`UtilsResponsiveOverlay` com `fullscreen-desktop`). O `SongTextRenderer` renderiza letra e cifra. O modo telão é uma camada adicional acima desse overlay, com estilo completamente diferente.

## Goals / Non-Goals

**Goals:**
- Fullscreen nativo via `requestFullscreen()`
- Fundo preto, texto branco, fonte grande (~1.4rem), sem qualquer chrome
- Toque na tela pausa/retoma auto-scroll
- Swipe horizontal navega entre músicas da playlist da escala
- Botão X discreto para sair

**Non-Goals:**
- Sincronização em tempo real com outros dispositivos
- Controle remoto (slide show)
- Exibição de cifra no modo telão (apenas letra)

## Decisions

**Overlay separado (não nova rota)**: manter tudo em `scale.vue` evita reload de dados. O modo telão é um `v-overlay` com `z-index` alto que cobre tudo.

**Swipe com pointer events**: usar `pointermove` / `pointerdown` / `pointerup` para detectar swipe horizontal sem dependência de biblioteca — padrão já adotado no `SongTextRenderer`.

**`requestFullscreen`**: chamado no elemento do overlay ao abrir o modo telão; `exitFullscreen` ao fechar.

## Risks / Trade-offs

- [`requestFullscreen` no iOS Safari] → Safari exige interação do usuário; o clique no botão "Telão" já é essa interação. Aceitável.
- [Swipe conflita com auto-scroll] → Swipe horizontal não interfere com scroll vertical. Aceitável.
