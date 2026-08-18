## Why

Durante o culto, o líder ou músico precisa projetar a letra da música no telão usando o celular ou tablet. A tela cheia atual ainda tem chrome do app (AppBar, toolbar com abas). O modo telão remove tudo — fundo preto, texto branco grande, sem distrações.

## What Changes

- Botão "Telão" no viewer de letra/cifra da escala que abre uma tela completamente limpa: fundo preto, texto branco em fonte grande, sem AppBar, sem BottomNav, sem toolbar, sem bordas.
- Toque na tela pausa/retoma o auto-scroll.
- Swipe horizontal troca para a próxima/anterior música da playlist da escala.
- Botão de fechar discreto (X) no canto superior.

## Capabilities

### New Capabilities

- `presentation-mode`: Visualização de letra em modo telão — tela cheia sem chrome, fonte grande, fundo preto, navegação por swipe entre músicas.

### Modified Capabilities

<!-- Nenhuma spec existente com mudança de requisitos -->

## Impact

- **Backend**: Nenhum.
- **Frontend (web)**: Nova rota ou overlay `PresentationMode` em `scale.vue`; reutiliza `SongTextRenderer` com props de tamanho e tema; usa `document.documentElement.requestFullscreen()` para fullscreen nativo.
- **Banco de dados**: Sem migration.
