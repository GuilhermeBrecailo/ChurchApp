# ChurchApp — direção visual

## Ideia central

**A rotina da igreja organizada com clareza e cuidado.**

O app logado segue os padrões da Apple (Human Interface Guidelines): parece um
app de iPhone/iPad/Mac bem feito, simples para quem é leigo, sem "cara de
template" nem de interface gerada por IA. A identidade da igreja aparece na
**cor de destaque** (terracota), não em enfeites.

## Sistema visual do app (logado)

- **Fonte:** a do sistema (`-apple-system`, SF Pro no iPhone/Mac; Inter como
  reserva em outros sistemas). Sem fonte serifada nem monoespaçada em títulos
  e rótulos. Monoespaçada só para códigos (ex.: código de convite).
- **Título grande** em negrito no topo de cada tela (Large Title), subtítulo
  em cinza. Linha acima do título (como a data no Início) em caixa alta
  pequena e cinza, na fonte do sistema.
- **Fundo agrupado:** cinza `#F2F2F7` no claro, preto `#000000` no escuro.
- **Listas e cartões:** brancos no claro (`#1C1C1E` no escuro), raio 12px,
  **sem sombra**; separadores finos (`#E5E5EA` / `#2C2C2E`). Sombra só em
  janelas que flutuam (folhas, diálogos, menus).
- **Texto:** principal `#1C1C1E`, secundário `#6E6E73` (escuro: `#F5F5F7` e
  `#98989D`).
- **Cor de destaque:** terracota `#B5472A` (escuro `#F0975A`) para o botão
  principal da tela, item ativo, links e ícones da barra lateral. **Um botão
  cheio por tela**; as demais ações em tom suave ("tinted") ou só texto.
- **Barra de abas (celular/iPad em pé):** translúcida, linha fina no topo, aba
  ativa só com ícone e nome na cor de destaque (sem "pílula").
- **Barra lateral (computador/iPad deitado):** translúcida, no máximo dois
  níveis, grupos que abrem e fecham, item ativo com realce suave.
- **Abas da tela:** controle segmentado da Apple (trilho cinza, item ativo
  branco com sombra leve). **Filtros:** cápsulas cinza preenchidas; a
  selecionada fica na cor de destaque.
- **Ajuda:** botão de texto "Ajuda", sem fundo.
- **Movimento** curto e funcional, respeitando `prefers-reduced-motion`.

Os valores estão em `web/app/assets/css/theme.css` (tokens `--app-color-*`) e
no tema do Vuetify em `web/nuxt.config.ts`.

## Regras de composição

- uma tarefa clara por tela e uma ação principal;
- o básico primeiro, o resto em "Mais opções" (revelação progressiva);
- toda tela vazia ensina o que vai ali e oferece no máximo uma ação;
- textos em português simples, com verbo ("Confirmar presença"), sem jargão;
- alvos de toque de pelo menos 44px e foco visível;
- nenhuma afirmação social sem dado real.

## Fora do app logado

- **Landing de vendas (`/comece`):** pode manter a personalidade de marketing
  (fundo creme discreto, Fraunces em títulos).
- **Página pública de cada igreja (`/c/[slug]`):** usa o tema e as
  configurações da própria igreja.
