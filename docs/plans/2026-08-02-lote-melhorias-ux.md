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

- [x] 2.1 Header enxuto: só botão voltar + título (remover a linha de descrição)
- [x] 2.2 Versículo do dia em destaque, em card maior no topo
- [x] 2.3 Vídeo por **link** (campo `videoUrl` no `DailyVerse`, renderizado pelo
      `MusicEmbedPlayer` que já existia). Upload de arquivo fica pra etapa 2.
- [x] 2.4 Histórico abaixo, com altura máxima (420px) e scroll interno
- [x] 2.5 Botão "Novo versículo" na própria tela. Permissão nova
      `PUBLISH_CONTENT`: pastor/admin sempre; demais membros só se o pastor
      conceder pelo cargo da igreja.

## Grupo 3 — Pedidos de oração

`web/app/pages/prayer.vue`

- [x] 3.1 Header: só título + voltar
- [x] 3.2 Botão "Novo pedido" logo abaixo do header

## Grupo 4 — Próximos cultos (página nova)

- [x] 4.1 Nova rota/página dedicada
- [x] 4.2 Título + informações do culto
- [x] 4.3 Cards de escala no mesmo padrão visual de `/scale`, sem ações de gestão
      (sem editar / apagar / gerenciar voluntários)
- [x] 4.4 Não exibir os contadores de gestão (pendentes / não viram / trocas) —
      esses são da tela de escala, não da vitrine de cultos
- [x] 4.5 Clicar num card abre `/scale` já posicionado naquela escala

## Grupo 5 — Devocionais

`web/app/pages/content/devotionals.vue`

- [x] 5.1 Botão de criar devocional na própria página (hoje só via `/admin`)
- [x] 5.2 Suporte a texto + vídeo por link (mesma decisão do 2.3)

## Grupo 6 — Bíblia

- [x] 6.1 Trocar o provedor de API — o atual (`abibliadigital.com.br`) está fora do ar,
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

- [x] 8.1 Tom virou `v-select` dos 24 tons válidos (12 maiores + 12 menores) e a
      API rejeita qualquer outra coisa (`SongKey.ts`, com teste)
- [x] 8.2 `SongTextRenderer` encolhe a fonte até a linha mais larga caber
      (ResizeObserver + medição em monospace). Alinhamento preservado, zero
      scroll horizontal
- [x] 8.3 `UtilsResponsiveOverlay` ganhou `fullscreen`: no mobile troca o bottom
      sheet por dialog de tela cheia
- [x] 8.4 Controles (velocidade, tom, instrumento) num único botão no topo
      direito do novo `MusicSongReader`
- [x] 8.5 Tabs Letra/Cifra fixas no topo do leitor, visíveis durante a leitura
- [x] 8.6 Colar o link do Cifra Club dispara a importação; tom, vídeo, letra e
      cifra vêm preenchidos — só falta salvar
- [x] 8.7 Trocar o tom transpõe cifra e cifra de teclado (`useSongChords.ts`:
      transpõe só linhas de acorde, a letra fica intacta)

## Grupo 9 — Escala + playlist de músicas

- [x] 9.1 O `v-select` de músicas virou construtor de playlist ordenada no
      formulário da escala
- [x] 9.2 Tom em chip por música + reordenar por setas ou arrastar (detalhe e
      formulário)
- [x] 9.3 "Tocar sequência" abre o leitor na ordem definida, com Anterior/Próxima
- [x] 9.4 Alternador Letra/Cifra define em que modo a sequência abre
- [x] 9.5 Bottom sheet novo de adicionar música: busca, cards espaçados, tom,
      BPM, categoria e posição na playlist visível ao selecionar
- [x] 9.6 `UserDepartmentMembership.canManageSongs` (migration) + toggles por
      membro no painel do líder: um para escala, outro para músicas

## Grupo 10 — Ministérios

- [x] 10.1 Chips "Visão geral" (contadores + quebra por tipo) e "Ministérios"
      (lista completa)
- [x] 10.2 Visão geral do detalhe: dashboard do topo mantido, card de líder
      removido, bloco de próximas escalas no lugar
- [x] 10.3 `Department.modules` (migration) + chips de módulos no cadastro; as
      abas do ministério passam a seguir os módulos escolhidos

## Grupo 12 — Conteúdo público e identidade da igreja

- [x] 12.1 Versículo do dia com opção "mostrar na página pública"
      (`DailyVerse.isPublic`)
- [x] 12.2 Devocional com a mesma opção (`Devotional.isPublic`)
- [x] 12.3 `GET /public/church/:slug` devolve `publicVerses` e
      `publicDevotionals`; a landing renderiza as duas seções (com vídeo)
- [x] 12.4 Upload da foto da igreja em Configurações
      (`POST /api/church/uploads/photo`, PNG/JPG/WEBP até 5 MB, grava em
      `Crunch.logo` e aparece na página pública)

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
2. **Permissão de criar conteúdo (2.5)** — ✅ decidido: permissão nova
   `PUBLISH_CONTENT` em `churchRole.permissions`; pastor/admin sempre.
3. **Migrations (9.6 e 10.3)** — ✅ liberadas, com campos zerados nos registros
   existentes:
   - `UserDepartmentMembership.canManageSongs` → `false` (líder/pastor/admin
     continuam liberados pelo papel, não pela flag)
   - `Department.modules` → array vazio, lido como "todos os módulos ativos",
     pra nenhum ministério antigo perder aba
   - `DailyVerse.isPublic` / `Devotional.isPublic` → `false` (nada vira público
     sozinho)

## Ordem de execução

1. ✅ Grupos 1, 2, 3, 4, 5, 6, 7 e 11
2. ✅ Grupos 8, 9 e 10 + Grupo 12 (conteúdo público e foto da igreja)
3. Pendente: 7.2 (tela global de músicas) e upload de vídeo por arquivo
   (etapa 2 da decisão 1)

## Sobreposição com propostas OpenSpec já existentes

- Grupo 6 → `openspec/changes/bible-reader-fixes`
- Grupo 8 → `openspec/changes/music-screen-improvements`
- Grupo 9 → `openspec/changes/schedule-screen-improvements`
- Grupo 10 → `openspec/changes/ministry-screen-improvements`
