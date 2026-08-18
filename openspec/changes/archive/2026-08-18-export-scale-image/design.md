## Context

A escala já tem todas as informações necessárias no `selectedDetailEvent`: título, data, `mediaItems` (músicas) e `volunteers`. O detalhe da escala é exibido num overlay — a captura precisa acontecer num elemento fora da tela (off-screen) para evitar artefatos de scroll e z-index.

## Goals / Non-Goals

**Goals:**
- Gerar imagem PNG da escala com músicas e voluntários
- Download automático no dispositivo do usuário
- Visual limpo, sem chrome do app

**Non-Goals:**
- Exportação em PDF
- Exportação da escala mensal completa (apenas a escala individual aberta)
- Compartilhamento direto via Web Share API (pode ser adicionado depois)

## Decisions

**`html2canvas`**: biblioteca madura, sem dependências de backend. Alternativa `dom-to-image` tem menos suporte a CSS moderno. `html2canvas` é a escolha padrão para este tipo de caso.

**Elemento off-screen**: renderizar `Scale/ExportCard.vue` em um `div` com `position: absolute; left: -9999px` antes da captura, evitando interferência com o overlay atual.

**Arquivo de saída**: `escala-[titulo]-[data].png` em kebab-case.

## Risks / Trade-offs

- [`html2canvas` com fontes customizadas] → Fonte Inter pode não ser capturada. Mitigação: usar fontes seguras (system-ui) no ExportCard.
- [Tamanho da imagem] → Escalar com `scale: 2` para qualidade adequada no mobile sem arquivos excessivamente grandes.
