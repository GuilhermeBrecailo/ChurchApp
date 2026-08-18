## 1. Frontend — Overlay de Modo Telão

- [ ] 1.1 Adicionar ref `isPresentationMode` e `presentationSongIndex` em `scale.vue`
- [ ] 1.2 Criar overlay `v-overlay` com `scrim="black"` e `z-index: 9999`, cobrindo toda a tela, ativado por `isPresentationMode`
- [ ] 1.3 Chamar `element.requestFullscreen()` ao abrir e `document.exitFullscreen()` ao fechar
- [ ] 1.4 Botão X (`mdi-close`) discreto no canto superior direito para fechar

## 2. Frontend — Renderização da Letra

- [ ] 2.1 Reutilizar `MusicSongTextRenderer` dentro do overlay com `mode="lyrics"`, `font-size` aumentado (CSS override `font-size: 1.4rem; line-height: 2`), fundo preto e texto branco
- [ ] 2.2 Passar `autoScroll` e `scrollSpeed` do estado existente (`songAutoScrollSpeed`)
- [ ] 2.3 Exibir nome da música no topo do overlay em fonte menor (sem outras informações)

## 3. Frontend — Swipe entre Músicas

- [ ] 3.1 Implementar detecção de swipe horizontal com `pointerdown` / `pointerup` no elemento do overlay (delta X > 60px = swipe)
- [ ] 3.2 Swipe esquerda avança `presentationSongIndex`; swipe direita recua — respeitando os limites da playlist
- [ ] 3.3 Ao trocar de música, resetar scroll para o topo

## 4. Frontend — Botão de Acesso

- [ ] 4.1 Adicionar botão "Telão" (ícone `Monitor` do Lucide) no toolbar do fullscreen viewer existente em `scale.vue`
- [ ] 4.2 Ao clicar, definir `presentationSongIndex` com o índice da música atual e abrir o modo telão
