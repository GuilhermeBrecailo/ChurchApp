# Ministério Infantil e Diaconato

## Contexto

O ChurchApp já organiza ministérios, pessoas da igreja, escalas por culto, confirmações/presenças e arquivos PDF. Ainda faltam fluxos próprios para o Ministério Infantil e para a operação do Diaconato no dia do culto:

- no Infantil, consultar os PDFs de atividades/aulas dentro do app, organizar as crianças e fazer chamada;
- relacionar cada criança aos responsáveis;
- no Diaconato, deixar registrado quem faz cada função em cada culto e acompanhar a preparação, especialmente na Santa Ceia.

Esta especificação cobre tanto as tarefas de desenvolvimento dessas funcionalidades quanto as listas operacionais usadas pelos ministérios dentro do app.

## Objetivos

- Ter área de crianças e chamada dentro do Ministério Infantil, acessível somente à equipe autorizada desse ministério.
- Permitir consultar os materiais PDF importados sem sair do ChurchApp.
- Registrar um ou mais responsáveis por criança e permitir que um responsável esteja ligado a mais de uma criança.
- Registrar por encontro apenas se cada criança veio ou não veio.
- Montar a escala do Diaconato culto a culto, atribuindo pessoas às responsabilidades daquele culto.
- Facilitar a criação da escala copiando a escala anterior, sem atribuição fixa nem rodízio automático.
- Organizar tarefas e conferências do culto em uma lista operacional do Diaconato, incluindo itens adicionais para Santa Ceia.
- Reaproveitar cultos, escalas, membros, confirmações e presenças existentes sempre que possível.

## Fora de escopo

- Portal ou login para pais/responsáveis na primeira versão.
- Check-in, check-out, retirada da criança ou validação de quem buscou.
- Informações médicas, autorizações, fotografia ou outros dados sensíveis da criança além dos dados cadastrais necessários e vínculo com responsável.
- Reconhecimento de texto (OCR) ou conversão automática do conteúdo do PDF em tarefas estruturadas; os PDFs continuam sendo documentos para consulta.
- Rodízio automático de diáconos ou atribuição permanente que se repita sem escolha do líder.
- Bloquear uma pessoa de participar de mais de um ministério; conflitos de escala são avisos contextuais.
- Envio de lembretes por WhatsApp/SMS. A primeira versão organiza e destaca os lembretes dentro do app e da tela do culto.

## Ministério Infantil

### Acesso e permissões

- O recurso fica dentro do Ministério Infantil; não cria uma área geral de crianças visível para toda a igreja.
- A autorização deve ser aplicada no servidor, além de ocultar as opções na interface: pessoas sem vínculo/permissão no Ministério Infantil não podem consultar crianças, responsáveis, chamadas ou PDFs restritos.
- Membros autorizados da equipe podem consultar a lista necessária para a aula e registrar a chamada.
- Líderes e pessoas autorizadas para gestão podem cadastrar/editar crianças, vínculos com responsáveis e materiais.
- Dados de responsáveis não devem ser expostos fora do fluxo autorizado de gestão.

### Crianças e responsáveis

- A criança é um cadastro da igreja sem necessidade de conta de usuário.
- O cadastro permite nome e informações básicas necessárias para identificar a criança, além de grupo/turma quando a igreja optar por organizar assim.
- Uma criança pode ter mais de um responsável; um responsável pode estar relacionado a várias crianças.
- Responsáveis podem ser pessoas sem login. Se já houver cadastro correspondente na igreja, o vínculo deve poder reutilizá-lo, evitando duplicidade.
- A primeira versão não concede acesso de responsável ao app nem envia dados de frequência para ele.

### Chamada

- A chamada é aberta por encontro/data e pode ser organizada por turma/grupo quando essa organização estiver configurada.
- Para cada criança, a equipe registra somente **presente** ou **ausente**. Não existe fluxo de retirada ou check-out.
- Antes de a equipe registrar a resposta, a criança pode aparecer como “não marcada”; isso é estado de preenchimento, não uma terceira resposta de frequência.
- A chamada pode ser corrigida por pessoas autorizadas do ministério, mantendo o encontro e a criança a que se refere.

### PDFs e aulas

- A equipe pode abrir a pré-visualização do PDF dentro da área do Ministério Infantil, sem depender de abrir outra aba.
- Os materiais continuam associados às aulas/atividades já importadas; título, data e turma/grupo podem ser apresentados quando disponíveis.
- Abrir e navegar no PDF não deve alterar o arquivo original nem exigir nova importação.

## Diaconato

### Escala por culto

- Cada culto tem uma escala do Diaconato com responsabilidades e pessoas escolhidas pelo líder para aquela data.
- A escala é definida manualmente culto a culto. O app pode oferecer “copiar escala anterior” como ponto de partida, mas o líder confirma/edita antes de salvar.
- As responsabilidades iniciais podem incluir, por exemplo, dízimo e recepção; a igreja pode ajustar os nomes conforme sua prática.
- Uma responsabilidade pode ter uma ou mais pessoas quando necessário. A mesma pessoa pode exercer responsabilidades diferentes, inclusive em ministérios distintos.
- Se a pessoa já estiver escalada em outro ministério para o mesmo culto, o app informa o nome da pessoa e a outra escala/função. Esse conflito é um aviso para o líder revisar, não um bloqueio automático.
- Reaproveitar as confirmações e o registro de presença já existentes para que o líder acompanhe quem confirmou e quem compareceu.

### Lista operacional e Santa Ceia

- A tela do culto mostra uma lista de conferência do Diaconato, associada à ocorrência/escala daquele culto.
- A lista permite concluir itens e, quando útil, indicar responsável e prazo/horário anterior ao culto.
- Itens padrão propostos: confirmar equipe/escala, conferir água e copos e preparar a Santa Ceia quando aplicável.
- Cultos com Santa Ceia devem ser identificados explicitamente para exibir os itens adicionais; a simples presença de uma palavra no título não deve disparar tarefas por engano.
- O líder pode ajustar os itens do culto. A tela destaca tarefas pendentes e lembretes no próprio app.
- As conferências operacionais não substituem a chamada/presença dos voluntários: escala, confirmação, presença e checklist são estados distintos.

## Considerações de dados e segurança

- Usar os cadastros de pessoas e os ministérios existentes; não criar uma segunda base de membros.
- Representar o vínculo criança-responsável de forma que suporte relações de vários para vários e respeite o isolamento por igreja.
- Relacionar chamada à criança e ao encontro do Ministério Infantil, sem reaproveitar a presença geral do culto como se fosse chamada infantil.
- Relacionar escala e checklist do Diaconato ao culto existente, evitando duplicar o conceito de culto/ocorrência.
- Validar autorização e escopo da igreja no backend em todas as leituras e gravações de crianças, responsáveis, chamadas e listas operacionais.
- Preservar escalas, cultos e materiais antigos; não fazer preenchimentos retroativos automáticos.

## Critérios de aceitação

1. Uma pessoa sem acesso ao Ministério Infantil não consegue consultar crianças, responsáveis, chamadas ou arquivos protegidos nem pela API.
2. A equipe autorizada consegue cadastrar uma criança e relacionar múltiplos responsáveis; o mesmo responsável pode ser ligado a irmãos sem criar cadastros duplicados.
3. A equipe consegue abrir um PDF importado em pré-visualização dentro do app e voltar à aula/lista sem perder contexto.
4. A chamada de um encontro registra presente/ausente por criança e distingue respostas ainda não preenchidas; não há check-in/out ou retirada.
5. O líder do Diaconato consegue criar a escala de um culto atribuindo pessoas às responsabilidades e pode copiar/ajustar a escala anterior.
6. Ao haver escala conflitante no mesmo culto, o líder vê quem está envolvido e a outra função/ministério; pode revisar antes de salvar.
7. A escala aproveita confirmações e presenças já existentes, sem duplicar a escala geral do culto.
8. O checklist do culto permite acompanhar itens pendentes/concluídos e mostra a conferência de água e copos; cultos marcados como Santa Ceia mostram seus itens adicionais.
9. Alterar escala/checklist de um culto não altera automaticamente outros cultos nem registros históricos.

## Verificação prevista

- Testes de autorização e isolamento por igreja para cadastros, vínculos, PDFs, chamadas e checklists.
- Testes de relações múltiplas entre crianças e responsáveis, prevenção de duplicidade e chamada presente/ausente/não marcada.
- Testes de criação/cópia/edição de escalas do Diaconato, aviso de conflito e preservação de confirmação/presença.
- Testes da lista de conferência comum e da lista condicional para Santa Ceia.
- Build e testes direcionados do frontend, com revisão visual do PDF inline, da chamada e da tela de escala/checklist em desktop e mobile.

## Decisões já confirmadas

- O acesso às funções do Infantil é restrito a quem está autorizado no Ministério Infantil.
- A frequência infantil registra apenas se veio ou não veio; não há retirada/check-out.
- No Diaconato, as atribuições são escolhidas culto a culto pelo líder; copiar a escala anterior é apenas uma facilidade editável.
- Conflitos com outras escalas devem ser apresentados para revisão, sem proibir a participação em mais de um ministério.
