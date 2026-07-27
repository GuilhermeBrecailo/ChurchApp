# Direção visual — Landing pública da igreja (`/c/:slug`)

Notas de design para orientar a implementação do frontend desta change. Não é um artefato OpenSpec formal — é referência para quem for construir `web/app/pages/c/[slug].vue` e os componentes relacionados.

## Contexto do problema de design

Cada igreja injeta sua própria cor de destaque (`accentColor`) e logo. Isso significa que a landing **não pode** ter uma identidade de marca fixa e forte (nada de fundo dark+neon nem de cream+serif genérico) — a personalidade de cada página vem da igreja, não do sistema. O sistema entra como uma base neutra, editorial, muito legível, que faz a cor de cada igreja parecer intencional em vez de brigar com o layout.

## Token system

**Cor (base neutra, `accentColor` é injetada via CSS var por igreja):**
- `--paper: #FBF8F3` — fundo (papel quente, não o cliché `#F4F1EA`)
- `--ink: #221F1A` — texto principal
- `--ink-soft: #6B655C` — texto secundário/legendas
- `--line: #E4DFD5` — divisores/hairlines
- `--card: #FFFFFF` — superfície de card
- `--church-accent` — dinâmica, vinda de `Crunch.accentColor`; fallback `#4F46E5` (mesmo primary do Vuetify hoje, pra igreja sem cor definida não ficar sem graça)

Dark mode (segue `useThemeMode.ts` já existente no projeto):
- `--paper-dark: #17140F`, `--ink-dark: #F3EFE6`, `--line-dark: #2C2820`, `--card-dark: #201C16`
- `--church-accent` continua igual, ajustar só luminosidade se contraste ficar baixo (calcular com WCAG, clarear se necessário)

Uso do accent: **nunca** como fundo full-bleed. Só em: régua fina à esquerda dos cards, botão de ativar notificação, bullets/tags de destaque, glow suave (baixa opacidade) atrás da logo no hero.

**Tipografia:**
- Display (hero, títulos de seção, título dos cards): **Fraunces** (serifada humanista, calorosa, sem parecer "bíblia antiga" nem corporativa) — carregar via Google Fonts como as demais fontes do projeto
- Corpo (parágrafos, texto do feed): **Inter** — já carregada globalmente no projeto (`nuxt.config.ts`), manter para consistência e performance
- Utilitária (horários, datas, tags de tipo): **IBM Plex Mono** — números tabulares para os horários de culto

## Layout

### Hero
```
┌───────────────────────────────────────────────────┐
│                                    [🔔 Ativar avisos]│  <- chip discreto, não modal
│   ·· glow accent suave atrás da logo ··            │
│   [LOGO]                                           │
│   Comunidade Vida                                  │
│   Uma igreja em Belo Horizonte, MG                 │  <- eyebrow, dado real da igreja
│                                                     │
│   Palavra de boas-vindas curta (opcional, do pastor)│
│   [ Ver próximos cultos ↓ ]                        │
└───────────────────────────────────────────────────┘
```
Logo centralizada ou alinhada à esquerda dependendo da proporção da imagem (objectfit contain, nunca esticar). Nome da igreja em Fraunces, peso alto. Eyebrow (cidade/estado) em Inter uppercase, tracking largo, `--ink-soft`.

### Próximos cultos — "quadro de horários" (elemento de assinatura)
Inspirado nos quadros físicos de horário de culto/hinário que ficam na entrada de igrejas: números grandes em mono, régua fina à esquerda na cor da igreja, sem ícones de calendário genéricos.
```
── PRÓXIMOS CULTOS ──────────────────────────
│ 19:00   Culto de Celebração         DOM
│ 07:00   Culto da Manhã              DOM
│ 19:30   Culto de Oração             QUA
──────────────────────────────────────────────
[ Esta semana ] [ Este mês ]   <- toggle simples
```
Estado vazio (sem horários cadastrados): "Ainda não há horários publicados. Volte em breve." — sem ícone de erro, tom convidativo.

### Feed público (avisos / palavra do pastor / orações)
Cards em `--card` sobre `--paper`, régua fina à esquerda na cor do accent. Estrutura de cada card:
- Tag do tipo em caixa alta, Plex Mono, cor accent: `PALAVRA DO PASTOR` / `ORAÇÃO` / `AVISO`
- Data relativa em `--ink-soft`
- Título em Fraunces, peso médio
- Corpo em Inter
- Item fixado (`pinned`): pequeno indicador de "dobra" no canto superior direito do card (sutil, só aparece quando `pinned = true` — carrega informação real, não é decoração)

### Prompt de notificação
Não usar modal bloqueante no carregamento. Chip/banner discreto no canto do hero, aparece ~2s após o carregamento, com texto direto: "Quer saber quando tiver culto ou aviso novo?" + botão "Ativar notificações" + link-texto "Agora não". Se o visitante recusar ou fechar, não repetir na mesma sessão de navegador (guardar em `localStorage`). Nunca interromper a leitura do conteúdo da página.

## Redação (copy)

- Vocabulário do ponto de vista de quem visita, não do sistema: "Ativar notificações", não "Inscrever-se em push".
- Estado vazio é convite, não erro: "Ainda não há avisos publicados" em vez de "Nenhum resultado encontrado".
- Botões descrevem a ação, não o mecanismo: "Ver próximos cultos", "Ativar notificações", "Agora não".

## O que NÃO fazer

- Fundo dark com accent neon (não combina com o tom acolhedor pedido).
- Calendário genérico tipo grade de mês com ícone de calendário de app corporativo — o quadro de horários é o elemento de assinatura, não um `<input type="date">` disfarçado.
- Cor da igreja usada em blocos grandes de fundo — sempre em traços finos/pontuais.
- Popup nativo de permissão de notificação disparado sem contexto — sempre mostrar o chip explicando o motivo antes de chamar `Notification.requestPermission()`.
