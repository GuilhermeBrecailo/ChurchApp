## Why

Hoje o cadastro de conteúdo está espalhado em cards soltos numa aba do admin, e nem tudo tem controle claro de "aparece na página pública". O pastor quer uma **tela específica de conteúdo**, onde ele escolhe o tipo (aviso, versículo, devocional, publicação) e cada item tem, de forma consistente, a opção de publicar na página pública — além de conseguir apagar tudo e saber onde fica o calendário da semana.

> Status: proposta (spec + tarefas). Ainda não implementado.

## What Changes

- Nova **tela de Conteúdo** dedicada com um seletor de tipo ("O que você quer publicar?": Aviso, Versículo/Palavra, Devocional, Publicação, Horário de culto), abrindo o formulário certo para cada um.
- **Todo tipo de conteúdo** ganha, de forma consistente, o controle "Aparecer na página pública" (hoje alguns têm, outros não).
- O **calendário da semana** (horários de culto) fica nessa tela, num lugar óbvio, junto dos demais conteúdos.
- **Apagar** disponível para todos os tipos (aviso, versículo, devocional, publicação, horário), com confirmação.
- Uma **lista unificada** do que já foi publicado, com filtro por tipo e o status público/interno.

## Capabilities

### New Capabilities

- `content-studio`: Tela dedicada de gestão de conteúdo da igreja — seletor de tipo, publicação na página pública consistente, calendário no mesmo lugar, exclusão de todos os tipos e lista unificada.

### Modified Capabilities

<!-- Sem specs arquivadas; nada a modificar em nível de spec. -->

## Impact

- **Frontend (web)**: nova página/aba de Conteúdo (provável `app/pages/admin` ou um componente dedicado) reorganizando os cards atuais (versículo, avisos, devocionais, publicações) sob um seletor de tipo, com o card de horários de culto incluído; lista unificada com filtro por tipo. Reaproveita os composables existentes (`useDailyVerse`, `useAnnouncements`, `useDevotionals`, `usePosts`, `useServiceTimes`).
- **Backend (api)**: garantir `isPublic` (ou equivalente "aparece na página") em todos os tipos que ainda não têm de forma consistente, e endpoints de exclusão para todos (a maioria já existe). Verificar o versículo do dia e o devocional quanto ao toggle público na criação/edição.
- **Sem migração nova** prevista além de eventuais colunas `isPublic` faltantes.
