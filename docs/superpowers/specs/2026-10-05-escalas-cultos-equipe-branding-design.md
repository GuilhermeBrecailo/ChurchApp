# Correções de escalas, cultos, equipe e marca

## Contexto

Relatos de uso apontam fricção em quatro partes do ChurchApp: mensagens de música duplicada não dizem qual título conflitou; o formulário de escala dentro do ministério ainda exige culto e não oferece cultos avulsos; a equipe não aceita a mesma pessoa em funções diferentes na mesma escala; e alguns pontos do PWA ainda exibem "AppChurch". Também é necessário que o líder titular seja associado automaticamente ao ministério como membro.

O backend já aceita `serviceOccurrenceId` opcional ao criar uma escala. A API de cultos já resolve/cria de forma idempotente a ocorrência de um horário recorrente para uma data, e a listagem de cultos já combina ocorrências avulsas com opções recorrentes futuras. A associação de uma pessoa a mais de um ministério também é suportada; o bloqueio que impede múltiplas funções está na escala e em sua atualização.

## Objetivos

- Identificar pelo título a música já existente em erros de cadastro/importação.
- Permitir criar ou editar escala sem culto e sem impedir a inclusão direta de músicas.
- Permitir vincular um culto avulso existente ou um horário recorrente na data da escala.
- Materializar a ocorrência recorrente automaticamente quando uma escala for salva com esse vínculo, sem criar ocorrências futuras em lote.
- Permitir que uma pessoa tenha várias funções distintas na mesma escala e esteja em escalas de ministérios diferentes; impedir apenas a repetição da mesma pessoa na mesma função.
- Permitir remover cada atribuição de forma independente e facilitar o acesso à gestão da equipe durante a edição da escala.
- Criar/garantir a associação de membro quando alguém é definido como líder titular de um ministério.
- Exibir "ChurchApp" nos nomes visíveis do PWA e nas notificações push padrão.

## Não objetivos

- Não gerar cultos recorrentes futuros em lote ou criar uma nova rotina/agendamento automático.
- Não bloquear escalas simultâneas em ministérios diferentes. O aviso atual de conflito continua informativo.
- Não remover automaticamente o vínculo de membro de um antigo líder ao trocar a liderança; ele pode continuar sendo membro do ministério.
- Não renomear identificadores técnicos de autenticação, realm/client IDs, nomes internos ou domínio/cookie `appcunch.shop`.
- Não exigir culto em escalas antigas nem preencher retroativamente vínculos ausentes.

## Comportamento e regras

### Música duplicada

- Erros de criação e importação devem mencionar o título que já existe no ministério.
- A validação local do formulário deve apresentar o mesmo contexto, antes de enviar o pedido.
- A comparação continua ignorando maiúsculas/minúsculas e limitada ao ministério atual.

### Culto opcional e vínculo

- Os formulários de escala geral e de ministério aceitam escala sem `serviceOccurrenceId`; título e data da escala continuam obrigatórios.
- A seleção de culto lista ocorrências futuras com data e horário, incluindo cultos avulsos e datas derivadas de horários recorrentes.
- Selecionar um culto existente vincula sua ocorrência. Selecionar uma data recorrente ainda não materializada resolve/cria a ocorrência por `serviceTimeId + date` ao salvar, reutilizando a ocorrência caso já exista.
- Sem seleção de culto, o formulário não chama a API de resolução e salva a escala sem vínculo.
- Um culto selecionado deve manter data e horário coerentes com a escala; limpar a seleção retorna o formulário ao modo de escala sem culto.
- A criação manual de cultos permanece disponível no fluxo próprio de Cultos e respeita as permissões existentes.

### Atribuições e remoção

- A identidade de uma atribuição passa a ser a atribuição (e não somente `userId`): uma pessoa pode aparecer em mais de uma função da mesma escala.
- O mesmo `userId` com a mesma função não pode ser incluído duas vezes; a comparação da função ignora espaços periféricos e diferenças de caixa.
- A atualização preserva os dados de confirmação/presença da atribuição existente quando a equipe é salva, atualiza/removida por atribuição e não por pessoa inteira.
- Notificações continuam sendo enviadas uma vez por pessoa, mesmo que ela tenha mais de uma função. A entrada/saída é determinada pela presença da pessoa em qualquer atribuição antes/depois.
- A remoção de uma função não remove as outras funções da pessoa. O editor de escala oferece acesso direto a "Gerenciar voluntários".
- Conflitos de data entre ministérios continuam como aviso, sem impedir a atribuição.

### Líder como membro

- Ao criar um ministério, criar também o vínculo de membro do líder, na mesma operação lógica.
- Ao trocar o líder titular, garantir o vínculo do novo líder. Se já existir vínculo, preservá-lo; se não houver ministério principal para a pessoa, marcar este como principal, senão manter como secundário.
- O vínculo anterior do líder não é removido automaticamente.
- A regra vale para os fluxos de criação/alteração de ministério usados pela API ChurchApp; caminhos administrativos legados só devem ser ajustados se estiverem ativos no fluxo real do produto.

### Marca

- Trocar "AppChurch" por "ChurchApp" no nome e nome curto do manifesto PWA e no título padrão da notificação push.
- Não alterar `appcunch.shop`, `appchurch` como realm/client ID, ou outras chaves técnicas.

## Áreas prováveis

- API: adaptadores de músicas, escalas e ministérios; testes Jest correspondentes.
- Web: `web/app/pages/ministery/[id].vue`, formulários de escala e diálogo de atribuições, composable de ocorrências; testes de escala existentes ou novos testes de utilitários.
- PWA: `web/public/manifest.webmanifest` e `web/public/sw.js`.

## Critérios de aceitação

1. Música duplicada retorna/exibe mensagem que identifica o título, tanto no cadastro quanto na importação por PDF.
2. Escala sem culto pode ser criada/atualizada desde os dois formulários, com música selecionada, sem chamada de resolução de ocorrência.
3. Um culto manual futuro aparece como opção de vínculo; selecionar uma recorrência cria/reutiliza apenas a ocorrência daquela data.
4. Uma pessoa com duas funções distintas resulta em duas atribuições persistidas; repetir pessoa + função é recusado; remover uma função mantém a outra.
5. Atualização com várias funções envia no máximo uma notificação por pessoa e contabiliza corretamente pessoas que entraram ou saíram.
6. O líder novo aparece na associação/lista de membros após criar o ministério ou trocar o líder, sem duplicar uma associação existente.
7. O editor da escala permite abrir a gestão de voluntários durante uma edição.
8. Nome/ícone instalável e notificação padrão mostram "ChurchApp"; domínio e identificadores de autenticação permanecem inalterados.

## Verificação

- Testes direcionados de adaptadores para duplicidade de música, associação automática do líder e atualização de múltiplas atribuições.
- Testes de frontend para seleção/vínculo opcional de culto e identificação/remoção de atribuições, quando a estrutura atual permitir teste unitário direto.
- `npm run api:typecheck`, testes Jest relevantes e `npm run web:build`.
- Revisão visual dos formulários alterados e busca final por marcas visíveis restantes, preservando ocorrências técnicas.
