# Lote de melhorias de UX — 02/08/2026

Backlog estruturado a partir da lista passada pelo usuário. Cada grupo é um
entregável coerente (mesma tela / mesmo domínio), pra poder ser feito e
validado isoladamente.

Legenda: ⚠️ = decisão pendente ou mudança de banco necessária.

---

## Grupo 1 — Home (dashboard)

`web/app/pages/index.vue` + `web/app/components/Dashboard/*`

- [x] 1.1 Card "Versículo do dia" (`Dashboard/DailyVerseCard/index.vue`)
  - Remover o link "Histórico" do topo do card
  - Não renderizar o card quando não houver versículo do dia
  - Reduzir o conteúdo: ícone + título + texto do versículo
  - Card inteiro vira o acesso para `/content/verse`
- [x] 1.2 Card "Pedidos de oração" (`Dashboard/PrayerPreviewCard/index.vue`)
  - Só renderizar se houver pedido criado nos últimos 7 dias
  - Remover o "Ver todos" (o card inteiro passa a ser o acesso)
- [x] 1.3 Card "Próximos cultos" (`Dashboard/UpcomingEvents/index.vue`)
  - Só renderizar se houver culto
  - Remover o "Ver todos"
  - ⏳ Clique ainda abre `/scale?schedule=id`; será repontado para a página nova
    quando o Grupo 4 for feito

## Grupo 2 — Versículo do dia

`web/app/pages/content/verse.vue`

- [ ] 2.1 Header enxuto: só botão voltar + título (remover a linha de descrição)
- [ ] 2.2 Versículo do dia em destaque, em card maior no topo
- [ ] 2.3 ⚠️ Suporte a vídeo no versículo (link vs. upload — ver Decisões)
- [ ] 2.4 Histórico abaixo, com altura máxima e scroll interno
- [ ] 2.5 ⚠️ Botão "Novo versículo" para pastor/admin e delegados (hoje só existe no `/admin`)

## Grupo 3 — Pedidos de oração

`web/app/pages/prayer.vue`

- [x] 3.1 Header: só título + voltar
- [x] 3.2 Botão "Novo pedido" logo abaixo do header

## Grupo 4 — Próximos cultos (página nova)

- [ ] 4.1 Nova rota/página dedicada
- [ ] 4.2 Título + informações do culto
- [ ] 4.3 Cards de escala no mesmo padrão visual de `/scale`, sem ações de gestão
      (sem editar / apagar / gerenciar voluntários)
- [ ] 4.4 Não exibir os contadores de gestão (pendentes / não viram / trocas) —
      esses são da tela de escala, não da vitrine de cultos
- [ ] 4.5 Clicar num card abre `/scale` já posicionado naquela escala

## Grupo 5 — Devocionais

`web/app/pages/content/devotionals.vue`

- [ ] 5.1 Botão de criar devocional na própria página (hoje só via `/admin`)
- [ ] 5.2 ⚠️ Suporte a texto + vídeo (mesma decisão do 2.3)

## Grupo 6 — Bíblia

- [ ] 6.1 Trocar o provedor de API — o atual (`abibliadigital.com.br`) está fora do ar,
      então toda leitura cai no fallback Almeida disfarçado da versão escolhida.
      Já existe a proposta em `openspec/changes/bible-reader-fixes`.

## Grupo 7 — Minha Playlist

`web/app/pages/content/playlist.vue`

- [x] 7.1 Corrigir o padding entre título e descrição no header
- [~] 7.2 Estado vazio: rótulo trocado para "Ver músicas" e copy ajustada, mas
      ⚠️ **ainda leva para a lista de ministérios** — hoje não existe tela global
      de músicas (elas vivem dentro de cada ministério). Um "ver músicas" de
      verdade precisa de uma tela nova, que faz mais sentido junto do Grupo 8.

## Grupo 8 — Músicas (editor + leitor)

- [ ] 8.1 Validar o tom no cadastro (aceitar apenas tons válidos)
- [ ] 8.2 Cifra com largura fixa — sem scroll horizontal
- [ ] 8.3 Tela cheia: o bottom sheet deve ocupar a tela inteira
- [ ] 8.4 Botão no topo direito abrindo os controles de velocidade e tom
- [ ] 8.5 Seletor letra/cifra acessível durante a leitura
- [ ] 8.6 Link do Cifra Club prevalece: importa e preenche tudo, resta só salvar
- [ ] 8.7 Trocar o tom transpõe a cifra automaticamente

## Grupo 9 — Escala + playlist de músicas

- [ ] 9.1 Selecionar músicas e montar a playlist da escala
- [ ] 9.2 Mostrar o tom de cada música e facilitar a reordenação
- [ ] 9.3 Botão que abre todas as músicas em sequência, na ordem definida
- [ ] 9.4 Escolher se abre em letra ou cifra
- [ ] 9.5 Melhorar o bottom sheet de adicionar música (espaçamento + informação
      visível ao selecionar)
- [ ] 9.6 ⚠️ Líder do ministério define, por membro, quem pode alterar escala e
      adicionar música (precisa de mudança no banco — hoje a permissão é por
      departamento, não por membro)

## Grupo 10 — Ministérios

- [ ] 10.1 Lista: chips de navegação ("Visão geral" com x ministérios / x ativos,
      "Ministérios" listando todos os cadastrados)
- [ ] 10.2 Detalhe → visão geral: manter o dashboard do topo, remover o bloco de
      líder, manter o de escalas
- [ ] 10.3 ⚠️ Criar ministério escolhendo os módulos ativos (músicas, recursos,
      tarefas...) — precisa de campo novo no `Department`

## Grupo 11 — Usuário

`web/app/pages/user.vue`

- [x] 11.1 Substituir o card "Serviço na igreja" por "Meus ministérios" (lista os
      ministérios em que o usuário está, cada um clicável). Exigiu expor
      `isMember` em `GET /api/church/departments` — a consulta de memberships já
      existia no adapter, só não era aproveitada.
- [x] 11.2 Card "Meus dados" (nome, e-mail, perfil, igreja + telefone). O card
      "Contato" foi absorvido por ele em vez de ficar solto.
- [x] 11.3 Card de indisponibilidade mantido (já existia e já estava correto)
- [x] 11.4 Remover o card "Sugestão pastoral"
- [x] 11.5 Manter o card "Redefinir senha"

---

## Decisões

1. **Vídeo (2.3 e 5.2)** — ✅ decidido: **os dois**, em duas etapas. Primeiro
   link (YouTube/Instagram, aproveitando o `MusicEmbedPlayer` que já existe),
   depois upload de arquivo como etapa separada (exige storage novo, endpoint de
   upload e limite de tamanho).
2. **Permissão de criar conteúdo (2.5)** — ⚠️ pendente: "quem ele quiser" deve
   usar o sistema de permissões que já existe (`churchRole.permissions`) com uma
   permissão nova do tipo `MANAGE_CONTENT`?
3. **Migrations (9.6 e 10.3)** — ⚠️ pendente: os dois exigem alteração de schema
   Prisma + migration. Confirmar antes de mexer no banco de produção.

## Ordem de execução

1. ▶️ **Em andamento:** Grupos 1, 3, 7 e 11 (frontend puro, sem migration)
2. Depois: a definir com o usuário

## Sobreposição com propostas OpenSpec já existentes

- Grupo 6 → `openspec/changes/bible-reader-fixes`
- Grupo 8 → `openspec/changes/music-screen-improvements`
- Grupo 9 → `openspec/changes/schedule-screen-improvements`
- Grupo 10 → `openspec/changes/ministry-screen-improvements`
