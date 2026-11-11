# Redesign do ChurchApp: proposta unificada

**A identidade visual (cores, tema escuro, fontes) continua a mesma.** O que muda é a **organização**: onde cada coisa fica, como a pessoa chega até ela e o que o app pede para quem está começando do zero.

**Como esta proposta foi feita.** Seis agentes trabalharam em paralelo e eu juntei o resultado:

| Agente | Assunto |
| --- | --- |
| 1 | pesquisa de padrões |
| 2 | navegação e Início |
| 3 | ministérios |
| 4 | primeiro uso |
| 5 | escalas e cultos |
| 6 | pessoas e configurações |

Onde as propostas conflitavam, a decisão está marcada com **⚖**. O retrato de como o app funciona hoje está em [`mapa-de-fluxos.md`](./mapa-de-fluxos.md).

---

## 1. Princípios (padrões que já funcionam)

| Regra | De onde vem |
| --- | --- |
| No máximo **5 abas fixas** na barra, cada uma com ícone e nome. **Sem aba "Mais"**: o que fica escondido ali, ninguém acha | Apple HIG, Material 3, NN/g (navegação escondida é usada metade das vezes) |
| As abas **não mudam de lugar** entre papéis. Só a 4ª muda | Apple HIG ("abas instáveis confundem") |
| **Cada destino tem uma única porta de entrada**: nada de atalho na barra, no Início, no "Mais" e num hub ao mesmo tempo | NN/g (hubs gastam espaço com links em vez de conteúdo) |
| O Início é uma **lista do que fazer**, e cada coisa aparece uma vez | Padrão de "caixa de ações" |
| **Sem carrossel de boas-vindas.** No lugar dele, um **checklist** com tarefas reais | NN/g: quem leu o tutorial não foi melhor que quem pulou; Shopify, Stripe e Linear usam checklist |
| **Toda tela vazia ensina**: uma frase sobre o que vai ali e um botão | NN/g, SAP Fiori |
| As ações mais comuns ficam **no próprio cartão da lista**, e o resto vai num menu "⋯". **No máximo 2 níveis** (lista → detalhe) | Apple HIG, NN/g (revelar aos poucos) |
| **Um editor por objeto**, aberto de qualquer lugar já com o contexto preenchido | Lei de Jakob |
| Para pessoas mais velhas: alvos de toque de **48 px**, texto de **16 px ou mais**, botões com verbo ("Confirmar presença"), aviso visível de sucesso, "Desfazer" em vez de "Tem certeza?" quando a ação tem volta | NN/g, WCAG 2.2 |

---

## 2. A nova barra de navegação

```
Membro:     [Início] [Escalas] [Igreja] [Perfil]
Líder:      [Início] [Escalas] [Igreja] [Ministérios] [Perfil]
Pastor:     [Início] [Escalas] [Igreja] [Gestão]      [Perfil]
```

| Aba | O que tem | Rotas que pertencem a ela |
| --- | --- | --- |
| **Início** | "Para você" (o que fazer), hoje na igreja, aviso, versículo | `/`, `/notifications` |
| **Escalas** | Minhas · Igreja · Organizar (líder) · **Cultos** | `/scale`, `/cultos/**` |
| **Igreja** | Avisos, Conteúdo (versículo, Bíblia, devocionais, playlist), **Oração**, ministérios, sobre a igreja | `/igreja`, `/content/**`, `/prayer` |
| **Ministérios** (líder) | **Só os ministérios que ele lidera**, com ações rápidas | `/ministery/**` |
| **Gestão** (pastor) | Ministérios · Pessoas · Cuidado · Comunicar · Relatórios · Configurações da igreja | `/admin`, `/pessoas/**`, `/comunicar`, `/configuracoes/**`, `/ministery/**` |
| **Perfil** | Meus dados, meus ministérios, datas em que não posso, **Minhas preferências** (tema, notificações, senha), sair | `/user`, `/perfil/**` |

**Decisões tomadas para fechar a barra:**
- ⚖ **"Escalas" e não "Agenda".** É a palavra que o voluntário usa. Os cultos entram como uma visão dentro dela.
- ⚖ **Pessoas fica dentro de Gestão,** e não numa aba própria do pastor. Assim a aba Igreja continua igual para todos. Pessoas também chega pelo Início: "3 pedidos para aprovar" leva direto para lá.

**Detalhes do resto da navegação:**
- **Desktop:** barra lateral com os mesmos itens, na mesma ordem. Gestão abre os subitens ali mesmo, e o líder vê a lista dos ministérios dele **com um clique cada**.
- **O que sai:**
  - o menu "Mais";
  - os "Atalhos" do Início;
  - o hub `/igreja` antigo (vira a aba Igreja);
  - o sol/lua do topo (vai para Minhas preferências).
- **Sem igreja ainda:** a barra não aparece. A pessoa vê uma tela de primeiro uso focada no próximo passo.
- **Pré-visualizar como membro:** enquanto o pastor está vendo o app como membro ou líder, aparece um aviso "Vendo como Membro · Sair". Hoje ele fica sem saber que está nesse modo.

---

## 3. Início: "Para você"

```
┌───────────────────────────────────────┐
│ Bom dia, Maria          ter, 12 de nov │
├───────────────────────────────────────┤
│ [Configure sua igreja · 2 de 6] (pastor, até terminar)
├───────────────────────────────────────┤
│ PARA VOCÊ                             │
│ ● Responda sua escala                 │
│   Louvor · dom 17/11 19h · Vocal      │
│   [Confirmar] [Talvez] [Não posso]    │
│ ● 3 pedidos para entrar na igreja  ›  │
│ ● Ligar para 2 visitantes          ›  │
│ ● Escala de domingo com 2 vagas    ›  │
├───────────────────────────────────────┤
│ HOJE NA IGREJA  (ou "esta semana")    │
│ 19h30 Culto de oração · Você serve    │
├───────────────────────────────────────┤
│ Aviso mais recente · Versículo do dia │
└───────────────────────────────────────┘
```

**O que entra na lista "Para você", por prioridade:**
1. **Prioridade 1:**
   - minhas escalas sem resposta (responde ali mesmo);
   - pedidos de troca;
   - escala da semana com vaga ou com "não posso".
2. **Prioridade 2:**
   - cadastros esperando aprovação;
   - pedidos de oração para revisar;
   - visitantes para contatar;
   - visitas de hoje ou atrasadas.
3. **Prioridade 3:**
   - aviso novo;
   - "ative as notificações";
   - perfil sem telefone.

**Como a lista se comporta:**
- Cada pessoa só vê o que tem permissão de fazer.
- Itens iguais se agrupam ("4 escalas para responder").
- Mostra no máximo 5 itens.
- Lista vazia mostra **"Tudo em dia"**.

**Saem do Início:**
- os 4 cartões de escala repetidos;
- os Atalhos;
- o painel pastoral (os alertas dele viram itens da lista);
- os pedidos de oração (vão para Igreja › Oração).

As escalas passam a ser buscadas **uma vez**. Hoje são 3 vezes, cada uma trazendo o histórico inteiro.

---

## 4. Primeiro uso (o app vazio)

### Pastor começando do zero

1. **Cadastro.** Nome, e-mail, WhatsApp e senha (com o olhinho para ver o que digitou).
   - O "Sou membro" sai desta tela e vira um link: "Recebeu um convite? Entre por aqui".
2. **Criar a igreja: uma tela, menos de 30 segundos.**
   - Pede: nome da igreja, cidade e UF.
   - Endereço, CEP e documento vão para Configurações depois.
   - ⚖ **Os 5 ministérios que hoje vêm pré-marcados saem daqui.** Eles criavam ministérios que a igreja nem usa, com o pastor como líder. Os ministérios passam a nascer pelo checklist e pelo assistente.
3. **Início com o checklist "Configure sua igreja · 1 de 6".** Cada passo abre a tela de verdade, e não um tutorial:

| # | Passo | Conta como feito quando… | O que o botão abre |
| --- | --- | --- | --- |
| 0 | Igreja criada | sempre ✓ (o progresso já começa andando) | — |
| 1 | Horários de culto | existe 1 horário | uma janelinha com sugestões prontas: "Domingo 10h", "Domingo 19h", "Quarta 19h30" |
| 2 | Primeiro ministério | existe 1 ministério | o **assistente de ministério** (seção 5) |
| 3 | Convidar pessoas | 2 membros ou 1 pedido | link, WhatsApp, QR, ou "cadastrar eu mesmo" |
| 4 | Primeira escala | existe 1 escala | o **editor de escala**, que fica bloqueado até ter um ministério |
| 5 | Página da igreja | tem logo ou mensagem de boas-vindas | "ver e compartilhar a página" |

**Como o checklist se comporta:**
- Ele **não esconde** o resto do Início. Hoje o cartão de primeiros passos substitui o Início inteiro.
- Dá para ocultar.
- Some quando tudo estiver pronto, depois de mostrar "Tudo pronto! 🎉".

### Membro

- **Uma entrada só: `/join`.** Também é aberta pelos links "Recebi um convite" no login e "Participe" na página pública da igreja.
- **Passos:**
  1. código;
  2. "Você vai pedir para participar da Igreja X";
  3. cadastro;
  4. **já entra logado**;
  5. página **"Aguardando aprovação"**, que confere sozinha quando o app volta a ficar visível.
- **Se o e-mail já existe:** "Você já tem conta, entre com sua senha", e o pedido continua depois do login.
- ⚖ **Uma regra só: todo convite passa por aprovação.** Hoje, quem já está logado entra direto. O pastor **recebe notificação** quando alguém pede para entrar, e o membro recebe quando é aprovado.
- **O carrossel de 5 telas sai.** No lugar, um cartão de boas-vindas no Início: "Bem-vinda à Igreja X, Maria!", três linhas e o botão "Avise-me quando eu for escalado".

### Senha

- **Membro criado pelo pastor:** cai numa tela própria, **"Crie sua senha pessoal"**. Depois de salvar, aparece "Senha criada!" e a pessoa **volta para onde ia**. Hoje ela fica presa no Perfil e o aviso de sucesso é apagado antes de aparecer.
- **Esqueci a senha, v1:**
  - Membro: botão "Pedir ajuda no WhatsApp", que leva ao pastor.
  - Pastor: botão que leva ao suporte.
  - O pastor ganha "Gerar senha temporária" no perfil da pessoa.
- **Esqueci a senha, v2:** link por e-mail. Depende de configurar o envio de e-mail (SMTP) no Keycloak.

### Avisos que pulam na tela

- Aparece **um aviso por vez**, nesta ordem: criar senha > criar igreja > checklist > notificações > instalar o app.
- **Nunca aparecem** no login, no cadastro, no convite nem na página pública da igreja.
- O "Instalar o app" só aparece **depois de uma ação concluída** ou na segunda visita.

---

## 5. Ministérios: o problema que você apontou

**A causa:**
- Hoje **nem a lista de ministérios nem a página do ministério têm botão de editar**. A edição fica escondida em Admin › Gestão de ministérios, num formulário que ainda **não tem módulos nem "ativo"**.
- Para montar uma escala, é preciso entrar no ministério e achar a aba.

**A solução:** a lista de ministérios vira o centro de comando.

```
┌──────────────────────────────────────────┐
│ 🎵 Louvor                 Líder: Carlos  │
│ Próxima escala: dom 17/11 · 3/6 confirmados │
│ [+ Nova escala]  [👥 Pessoas]      [⋯]   │
└──────────────────────────────────────────┘
  ⋯ → Ver escalas · Repertório · Configurar · Desativar
```

### A lista de ministérios

- **O que cada cartão mostra:** a **saúde da próxima escala**, com os botões **Nova escala** e **Pessoas** ali mesmo, sem entrar no ministério.
- **Botões que dependem de permissão:** só aparecem para quem pode usar.
- **Para o membro:** o cartão mostra "Você serve dom 17/11 · Violão". Tocar nele abre o ministério.
- **"Pessoas":** abre uma janela onde dá para adicionar **várias pessoas de uma vez**, tirar alguém e dar cargo.
- **"Configurar":** abre uma janela para mudar nome, tipo, líder, **ativo**, **módulos** e o modelo de escala.
  - A API já aceita tudo isso, então não precisa mexer no backend.
  - Aviso na tela: "Desligar só esconde a aba; nada é apagado."
- ⚖ **A tela `admin/ministerios` é apagada.** Quem abrir o endereço antigo cai em `/ministery`.

### "Criar ministério" em 3 passos

1. **Tipo.** Cartões grandes: Louvor, Crianças, Recepção, Mídia, Intercessão, Diaconato, Outro. Cada um diz o que já vem incluído.
2. **Nome e líder.** O nome já vem preenchido ("Louvor") e o líder é você ("dá para trocar depois").
3. **Pronto.** Mostra um resumo e deixa um "Personalizar" fechado. Ao criar, o botão seguinte é **"Adicionar pessoas"**.

Cada tipo já vem com os módulos certos. Hoje todo ministério nasce com 7 abas.

| Tipo | Abas que vêm ligadas |
| --- | --- |
| Louvor | Escalas, Repertório, Materiais |
| Crianças | Escalas, Aulas, Crianças |
| Mídia | Escalas, Materiais |
| Recepção, Intercessão, Diaconato | Escalas |
| Outro | Escalas, Tarefas |

### Página do ministério

As abas acompanham o endereço (`?aba=`), e cada uma carrega só os dados dela:

| Aba | O que tem |
| --- | --- |
| **Início** | **Membro:** a escala dele aqui, as próximas escalas e quem serve. **Líder:** checklist do ministério, **pendências com um botão cada** ("3 sem resposta → Lembrar", "Escala sem equipe → Montar equipe") e as próximas escalas |
| **Escalas** | Próximas (a mais perto primeiro) e Anteriores |
| **Repertório** | Lista de músicas, com **"Importar de PDF"** visível |
| **Pessoas** | Substitui a aba "Líder" |
| **Materiais, Aulas, Crianças, Tarefas** | Tarefas ganham **prazo e caixinha de concluir** |

A página do ministério hoje tem 2.900 linhas. Ela vira um "esqueleto" com as abas em componentes separados.

---

## 6. Escalas: uma escala só

**Uma folha de detalhes**, a mesma em todo lugar. Ela abre por `?escala=` / `?schedule=` em qualquer tela, então **o push abre direto a escala**.

- **O que o membro vê:**
  - a resposta dele;
  - o ensaio;
  - o repertório, com ordem, tom e "quem começa";
  - a equipe;
  - os recursos;
  - as tarefas do culto.
- **O que o líder vê a mais:**
  - "5 de 7 confirmaram · 1 pediu troca" e o botão "Lembrar quem não respondeu";
  - os motivos de quem não pode;
  - o menu: Editar, Montar equipe, Duplicar, Marcar presença, Enviar ao Holyrics, Apagar.
- **Ao abrir a folha, o app já marca a escala como "vista"** e o botão "Vi" sai.

**Um editor**, no lugar dos 2 editores e das 2 janelas de voluntários que existem hoje.

- **Como funciona:**
  - Abre já preso ao ministério ou ao culto de onde a pessoa veio.
  - Começa pelo **culto** (que preenche data e hora).
  - Depois a equipe: as funções vêm do modelo, e para cada função escolhe-se a pessoa.
  - Mostra os avisos **"Indisponível nesta data"** e **"Já está no Mídia neste culto"**, que não impedem de salvar.
  - O resto vem a seguir: ensaio, repertório (com ordem), recursos e tarefas.
- **Recursos extras:**
  - Copiar de uma escala anterior.
  - Um botão só: **"Salvar e avisar a equipe"**, que manda **um** push. Hoje a mesma edição manda dois.
- **Marcar presença sai do editor** e vai para uma janela própria. Montar a equipe (antes do culto) e marcar presença (depois) deixam de ficar misturados.

**Um jeito de responder.** Os mesmos 3 botões aparecem no Início, na lista, na folha e no push.

| Status | Rótulo | Cor |
| --- | --- | --- |
| PENDING | Pendente | cinza |
| CONFIRMED | Confirmado | verde-azulado |
| MAYBE | Talvez | âmbar |
| DECLINED | Não posso | vermelho |
| SWAP_REQUESTED | Pediu troca | roxo |

**O "Não posso" abre uma janela com:**
- um motivo opcional, com chips (Trabalho, Viagem, Saúde, Família) ou texto livre;
- "Quero trocar com alguém";
- "Marcar esta data como indisponível".

**Depois de responder:**
- Aparece **"Mudar resposta"**, que funciona até a escala começar.
- O bug de quem tem 2 funções na mesma escala é corrigido: hoje o selo fica "Confirmado" mesmo depois de a pessoa dizer "Não posso".

**Tela Escalas (`/scale`):**
- Três visões: **Minhas** (padrão) · **Igreja** · **Organizar** (só o líder, com números certos e só das escalas futuras).
- A lista é agrupada **por data** (esta semana, próxima, mês).
- O histórico vira "Ver escalas anteriores", que carrega 20 por vez.

**Cultos** (dentro de Escalas), com três abas:
- **Escalas:** um cartão por ministério ("Louvor 5/7" ou "Sem escala · Criar"). O "Criar" abre o editor **ali mesmo**.
- **Presença:** presença da equipe, contagem de público e "Finalizar culto". Passa a ser o único lugar de registrar público; Relatórios só lê.
- **Detalhes.**

Também ficam corrigidas as permissões que faltam na tela de culto e o "Finalizar", que hoje grava sempre na data de hoje.

---

## 7. Pessoas, configurações e comunicação (Gestão)

### Pessoas num lugar só

Hoje são 4 lugares: Admin Membros, Rol, Pastoral Pessoas e Visitantes.

**`/pessoas`: o diretório.**
- Uma busca e filtros com contagem: Todos · Com conta · **Pendentes** · Sem conta · Visitantes · **Em cuidado** · Desligados.
- Cada linha diz em palavras simples quem é a pessoa: "Visitante · retorno amanhã", "Membro · Louvor, Mídia".

**`/pessoas/[id]`: o perfil único da pessoa.**
- **Contato:** o WhatsApp e o e-mail **respeitam a autorização** dada pela pessoa.
- **Situação:** visitante → membro → desligado.
- **Acolhimento:** o funil do visitante.
- **Cuidado pastoral:** visitas e faltas.
- **Ministérios e escalas.**
- **Acesso e cargos:** "Dar cargo" num passo, já com os modelos prontos, e "Convidar para o app".
- **Dados:** a única parte com botão "Salvar". Todo o resto salva na hora.

**`/pessoas/cuidado`:** uma fila com data, para quem faz o cuidado pastoral. Junta o painel pastoral, as visitas e os retornos de visitantes.

**"Adicionar pessoa": um fluxo só.**
- Pede nome e telefone, e se é visitante ou membro.
- Depois pergunta "Acesso ao app?": **Agora não** · **Enviar convite** (recomendado) · Senha temporária.
- Isso acaba com os dois formulários de "novo visitante" que existem hoje.

### Configurações em dois lugares, com dois nomes

**Configurações da igreja:** uma lista agrupada, em que cada linha mostra a situação atual.
- **Sua igreja:** cadastro e logo (**um** lugar para enviar a foto), página pública e aparência, horários de culto.
- **Pessoas:** convite e QR.
- **Integrações:** WhatsApp, Holyrics.
- **Assinatura:** plano.
- **Avançado:** ver o app como membro ou líder.

**Minhas preferências** (no Perfil):
- tema **Claro / Escuro / Sistema**;
- notificações;
- senha;
- sair.

Os nomes "Integrações", "Cadastro" e "Geral" deixam de ser títulos de tela.

### Comunicar

Junta Mensagens e Publicações num lugar só, com o botão **"Novo comunicado"** em 3 passos:
1. **O quê:** aviso no app, WhatsApp, versículo, devocional ou publicação.
2. **Para quem:** mostra a contagem ao vivo.
3. **Quando:** mostra uma prévia e pede confirmação: **"Enviar para 47 pessoas"**.

A tela também tem "Enviados" (histórico) e "Automáticos" (pós-culto e aniversariantes).

---

## 8. Componentes compartilhados (base para tudo)

| Componente | Para quê |
| --- | --- |
| `UtilsPageHeader` | Voltar (para a tela-mãe, não para a anterior) + título + ajuda + ação principal |
| `UtilsSectionHeader` | Um estilo de título de seção (hoje são 4 só no Início) |
| `UtilsPageTabs` | Um estilo de abas, sincronizado com `?aba=` |
| `UtilsEmptyState` | Tela vazia que ensina, com no máximo um botão |
| `UtilsOverlayCard` | O interior padrão de toda janela e folha |
| `useAppToast` | Aviso de sucesso ou erro em todo o app (hoje não existe) |
| `utils/churchAccess.ts` | **Uma** regra de permissões (hoje o mesmo bloco está copiado em 13 arquivos) |
| `utils/scheduleStatus.ts` | Uma tabela de status de escala |

---

## 9. Bugs confirmados que entram já na Fase 0

1. **Editar um ADMIN o rebaixa para membro:** qualquer papel que não seja PASTOR vira "MEMBER" e é enviado ao salvar (`admin/pessoas.vue:1290,1364`).
2. **O WhatsApp ignora a autorização de contato dos visitantes,** nos envios em massa, nas regras e nos aniversariantes. É um **risco de LGPD**.
3. **A mensagem "Senha redefinida" é apagada antes de aparecer** (`user.vue:826-827`).
4. **Editar uma escala manda push 2 vezes** (`schedule.ts:594` e `:921`).
5. **Quem tem 2 funções na escala vê o status errado** depois de mudar a resposta.
6. **Oração:** quem tem a permissão de moderar não vê os pendentes (`prayer.vue:354`).
7. **Modelo de escala com as condições trocadas:** "Santa Ceia" × "Tarefas para conferir".
8. **Aba Recursos usa a permissão de músicas.**
9. **A pessoa com cuidado pastoral não consegue escolher alguém ao agendar visita,** porque o rol é só para o pastor.
10. **Erros que não aparecem:** ao salvar horários e ao dar ou tirar cargo.
11. **Ações destrutivas sem confirmação:** apagar publicação, modelo, regra, horário ou registro do rol; desconectar o WhatsApp; gerar um novo convite; "Enviar agora".
12. **Botão "Registrar visitante"** fora da checagem de permissão.
13. **Tela de culto:** "Adicionar escala" e "Finalizar" sem checar permissão, e o "Finalizar" grava na data de hoje.
14. **Progresso fixo de 50%** nos devocionais.

---

## 10. Ordem de implementação

Cada fase vira um PR (ou alguns) que pode ir para a `main` sozinho, com testes e prints antes e depois.

| Fase | O que entra | Precisa de backend? |
| --- | --- | --- |
| **0. Base + bugs** | Componentes da seção 8 e os bugs da seção 9 | Sim, pequeno: autorização no WhatsApp, push duplicado, rol para quem faz cuidado pastoral |
| **1. Navegação + Início + Primeiro uso** | Barra nova, Igreja, Gestão, "Para você", checklist, criar igreja, tela de senha, fim do carrossel e dos avisos empilhados | Opcional: notificação de pedido para entrar e convite sempre com aprovação |
| **2. Ministérios** | Lista como centro de comando, assistente, Configurar, Pessoas, página dividida em abas | Só para "quem recebeu a tarefa pode concluí-la" |
| **3. Escalas** | Folha única, editor único, resposta única, Minhas/Igreja/Organizar, cultos | `GET /schedules/:id`, `?scope=mine&from=` e salvar equipe junto com a escala |
| **4. Pessoas** | Diretório, perfil único, cuidado, cargos em um passo | `GET /people`, `GET /people/:id` e ligar a conta ao registro que já existe no rol |
| **5. Configurações + Comunicar** | Configurações da igreja, Minhas preferências (tema Sistema), Comunicar | Prévia com contagem de destinatários |

**Fases 2 e 3:** a ministérios vem antes porque é a sua maior queixa. O ministério usa provisoriamente o editor atual e troca para o editor único quando a Fase 3 entrar.

---

## 11. Decisões que são suas

Minha recomendação está em negrito. Se concordar com todas, basta dizer "ok".

1. **A barra fica Início · Escalas · Igreja · Gestão/Ministérios · Perfil, com Pessoas dentro de Gestão: SIM.**
2. **Todo convite passa por aprovação** (hoje quem já está logado entra direto)**: SIM**, com notificação para o pastor.
3. Membro vê as escalas da igreja toda? **SIM, mas abre em "Minhas" por padrão.**
4. **Criar a igreja sem os 5 ministérios pré-marcados**, que passam a nascer pelo checklist e pelo assistente: **SIM.**
5. **WhatsApp só para visitantes que autorizaram:** **SIM** (LGPD). Vamos oferecer "registrar autorização" para os que já estão cadastrados.
6. Esqueci a senha: **v1 pelo WhatsApp e pelo pastor gerando senha temporária**; o e-mail fica para quando o SMTP estiver pronto.
7. Se a data da escala mudar, as respostas voltam a "Pendente" e a equipe é avisada? **SIM.**
8. "Pediu troca": **por enquanto continua só um status**; o fluxo de substituto (o voluntário indica alguém e o líder aprova) fica para depois.
9. Líder (não só o pastor) pode mudar o tipo e os módulos do ministério? **SIM** (a API já deixa).
10. Igrejas que já existem e estão incompletas também veem o checklist? **SIM** (dá para ocultar).
