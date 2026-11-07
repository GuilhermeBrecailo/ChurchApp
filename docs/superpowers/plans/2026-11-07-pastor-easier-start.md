# Plano: início pastoral mais simples

## Objetivo

Facilitar o primeiro uso do ChurchApp para pastores e tornar as ações e a navegação relevantes mais fáceis de encontrar, sem mudar APIs, dados ou permissões.

## Escopo

1. Exibir a configuração inicial como checklist opcional no painel, sem substituir o restante da página; mantê-la visível enquanto faltar ministério ou equipe e lembrar a dispensa por usuário e igreja.
2. Apontar uma próxima ação pastoral usando somente os dados já retornados pelo painel.
3. Mostrar “Meus ministérios” nos atalhos e no menu Mais para líderes que já tenham permissão de ministério, inclusive quando também gerenciam pessoas.

## Arquivos previstos

- `web/app/pages/index.vue`: permissões de configuração, estado do checklist e composição não bloqueante do painel.
- `web/app/components/Dashboard/GettingStartedCard/index.vue`: progresso, ações e dispensa do checklist.
- `web/app/components/Dashboard/PastoralOverviewCard/index.vue`: prioridade contextual e link para a tela correspondente.
- `web/app/utils/roleNavigation.ts`: consistência entre navegação principal, atalhos e menu Mais.

## Preservar

- Autorização existente na API e as permissões de cada perfil.
- Dados e contratos atuais; nenhuma chamada nova à API.
- O painel de membros e as páginas fora desse fluxo.
- Preferências de múltiplas igrejas, guardando a dispensa por usuário e igreja.

## Critérios de conclusão

- O checklist não esconde o painel e não aparece para membros ou líderes sem gestão da igreja.
- O checklist continua até que ministério e equipe estejam configurados, podendo ser dispensado.
- A prioridade pastoral aparece somente quando os dados existentes indicarem uma ação.
- Um líder com acesso ao ministério encontra “Meus ministérios” nos caminhos de navegação apropriados; nenhum acesso é concedido pela API.
- A revisão estática e o detector de UI não encontram problemas novos; commit local inclui somente os arquivos desta tarefa.
