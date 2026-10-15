# Escalas configuráveis por ministério e modelos de mensagens

## Contexto

Hoje os formulários de escala compartilham campos que não servem igualmente a todos os ministérios. O Louvor já tem um fluxo adequado; o Diaconato precisa de horário de chegada e horário do culto, sem campos de ensaio. O backend já tem funções e checklist básicos para o Diaconato, mas as responsabilidades ainda não são configuráveis por igreja. A tela de Mensagens também usa uma apresentação própria e começa sem modelos sugeridos.

O ChurchApp é multi-tenant: configurações e modelos de uma igreja nunca podem aparecer ou ser alterados por outra.

## Direção aprovada

Usar modelos editáveis por ministério e igreja, montados com os campos e recursos já conhecidos pelo ChurchApp. Cada escala continua guardando seus próprios horários, atribuições e checklist; mudar o modelo não altera cultos ou escalas antigas.

Não será um construtor de campos arbitrários nesta primeira versão. A igreja poderá escolher quais blocos disponíveis usa e editar os nomes das funções e tarefas.

## Ministérios e modelos padrão

Na criação de ministério, apresentar opções de partida: Louvor, Diaconato, Crianças, Recepção, Mídia, Intercessão e Outro/Personalizado. “Louvor” aparece uma só vez na lista, preservando os identificadores antigos `WORSHIP` e `MUSIC` nos dados existentes.

Escolher uma opção preenche uma configuração inicial que o administrador ou líder autorizado pode revisar. “Outro/Personalizado” permite definir o nome e configurar os blocos disponíveis, funções e tarefas padrão. Configuração é por ministério, não compartilhada entre igrejas nem entre ministérios diferentes da mesma igreja.

### Configuração disponível na primeira versão

- Horário/data do culto e vínculo opcional com um culto existente.
- Horário de chegada da equipe.
- Ensaio, com data, hora e observações.
- Repertório e materiais de apoio.
- Funções da escala, editáveis como uma lista de nomes.
- Checklist padrão do ministério, com títulos e ordem editáveis.
- Uso da Santa Ceia e tarefas/funções adicionais para essa ocasião.

Os blocos que não se aplicam podem ser desativados no modelo. Os campos comuns e obrigatórios para identificar uma escala permanecem visíveis.

## Comportamento por ministério

### Louvor

Preservar o fluxo atual, inclusive ensaio, repertório, materiais e seleção de funções. Não alterar a experiência existente só para uniformizar telas.

### Diaconato

- Exibir data e horário do culto e um horário de chegada configurável.
- Não exibir ensaio por padrão.
- Começar com funções existentes — Dízimo, Recepção e Apoio — e checklist de confirmação da equipe e conferência de água/copos; a igreja pode editar, remover ou adicionar funções e tarefas.
- A lista de funções é um ponto de partida para cada culto, não uma associação fixa de pessoas.

### Santa Ceia

- A igreja configura se deseja usar o fluxo de Santa Ceia no Diaconato e quais funções/tarefas extras devem aparecer.
- Em uma escala marcada como Santa Ceia, carregar essas funções e tarefas como itens em branco para aquela ocorrência.
- O líder seleciona as pessoas manualmente a cada culto. Não preencher pessoas por histórico, rodízio ou padrão salvo.
- Se a igreja desativar esse uso, a opção e os itens extras não aparecem para ela.

## Fluxos

### Criar ou editar ministério

1. Escolher um modelo padrão ou “Outro/Personalizado”.
2. Informar nome e líder, aproveitando o cadastro e as permissões atuais.
3. Revisar os blocos ativos, a lista de funções e o checklist padrão; configurar Santa Ceia quando aplicável.
4. Salvar a configuração vinculada somente àquele ministério e à igreja atual.

### Criar escala

1. Selecionar o ministério no fluxo geral; em uma tela já aberta dentro do ministério, manter o vínculo atual.
2. Renderizar apenas os blocos ativados no modelo selecionado.
3. Pré-carregar nomes das funções e itens do checklist, sem nomes de pessoas.
4. Cada função começa como uma linha de rascunho sem pessoa; o líder escolhe alguém para cada linha que mantiver e pode remover funções que não serão usadas naquele culto. Não salvar atribuições sem pessoa: `ScheduleAssignment.userId` é obrigatório no modelo atual. Itens de checklist podem continuar sem responsável, como hoje.
5. Se a Santa Ceia estiver habilitada para a igreja, permitir marcá-la e acrescentar os itens configurados somente àquela escala.

Escalas existentes e registros históricos não são preenchidos retroativamente. A cópia de uma escala continua sendo uma ação explícita; o modelo padrão, por si só, nunca reutiliza pessoas de outro culto.

## Modelo de dados e API

- Adicionar configuração versionada ao ministério (`Department`), isolada pelo `crunchId` já existente. A API valida formato, opções e autorização no servidor.
- Adicionar horário de chegada opcional à escala (`Schedule`); horário do culto continua usando a data/hora já existente.
- Ao criar uma escala, usar funções e tarefas do modelo para montar o rascunho da ocorrência. Persistir somente atribuições que tenham pessoa selecionada em `ScheduleAssignment` (`userId` é obrigatório); itens de checklist continuam sendo `ScheduleChecklistItem` e podem ficar sem responsável.
- Quando a configuração ainda estiver ausente em um ministério antigo, derivar os valores iniciais pelo tipo atual e persistir somente quando o usuário salvar. Assim, a migração não altera escalas antigas.
- Mudanças de configuração afetam novas escalas, não ocorrências já criadas.
- Restringir leitura e gravação à igreja da sessão e às permissões atuais de gestão do ministério.

## Aba Mensagens

- Ajustar cabeçalho, navegação interna, espaçamento, listas, formulários, vazios e estados de carregamento para seguir os padrões já usados nas telas administrativas do ChurchApp, mantendo a paleta atual e a funcionalidade existente.
- Exibir modelos sugeridos para boas-vindas a visitantes, agradecimento pós-culto, aviso de culto e aniversário.
- Escolher uma sugestão abre o fluxo existente de criação com nome e conteúdo preenchidos; ao salvar, cria uma cópia independente no `MessageTemplate` da igreja (`crunchId`). Cada tenant pode editar ou remover sua cópia.
- Não ativar regras automáticas nem enviar mensagens ao escolher uma sugestão. Envio e automações permanecem ações explícitas nos fluxos existentes.
- Modelos já cadastrados não são sobrescritos nem duplicados.

## Fora de escopo

- Campos livres de qualquer tipo criados pelo usuário.
- Atribuição permanente, rodízio automático ou preenchimento automático de pessoas.
- Mudanças em autenticação, papéis de acesso ou isolamento multi-tenant já existentes.
- Alterações na integração Holyrics ou no envio automático de WhatsApp.
- Alterações retroativas em escalas, cultos, checklists ou mensagens já salvos.
- Commit, push ou publicação no servidor nesta etapa.

## Critérios de aceitação

1. Louvor mantém o fluxo atual sem regressões.
2. Diaconato mostra horário de chegada e horário do culto e oculta ensaio quando configurado assim.
3. Administradores/líderes autorizados conseguem selecionar um modelo padrão ou personalizar blocos, funções e tarefas para seu ministério.
4. Duas igrejas podem ter funções, checklists e uso de Santa Ceia diferentes sem vazamento de configuração.
5. A Santa Ceia carrega funções como linhas de rascunho sem pessoa e tarefas do checklist; o líder escolhe as pessoas das funções mantidas em cada culto, podendo remover as que não serão usadas. Nenhuma pessoa é preenchida automaticamente.
6. Uma configuração nova não modifica escalas históricas; as funções/tarefas de cada escala ficam registradas na própria ocorrência.
7. A tela de Mensagens segue os padrões visuais administrativos e uma sugestão salva uma cópia editável somente para a igreja atual.
8. Escolher uma sugestão não dispara envio nem ativa regra automática.
9. Testes cobrem presets, validação/autorização tenant-scoped, persistência de horários e funções, variação da Santa Ceia, preservação de históricos e cópias de modelos de mensagem.

## Verificação

- Testes unitários do mapeamento de modelos e dos blocos exibidos por ministério.
- Testes de API para validação de configuração, isolamento por igreja e criação de escalas/checklists por ocorrência.
- Testes de regressão para criação e edição de escalas do Louvor e para cópias tenant-scoped de modelos de mensagem.
- Build do front e revisão responsiva das telas de criação/edição de ministério, escala e Mensagens.
