# Prompt — revisão de UI/UX do ChurchApp navegando de verdade

Cole o texto abaixo numa sessão nova do Claude Code dentro deste repositório.
Ele já vem preenchido com o endereço, as jornadas e as personas do ChurchApp.
Antes, suba o modo demonstração (ver "Como preparar").

## Como preparar (uma vez, antes de colar o prompt)

```bash
cd web
npm install
npm run demo -- --port 3401
```

O app abre em `http://localhost:3401` com uma API simulada dentro do
navegador: igreja de exemplo, dados fictícios e nada sai da sua máquina
(sem banco, sem Keycloak, sem WhatsApp, sem pagamentos reais).

---

## Prompt

Comece usando a skill superpowers:brainstorming. Leia e siga suas instruções para alinhar contexto,
objetivo, escopo, restrições e critérios de conclusão antes de executar esta tarefa.
Respeite as autorizações já concedidas e os limites abaixo, sem ampliar o escopo nem repetir perguntas respondidas.
Em pedidos claros, prossiga sem aprovação genérica de design ou plano. Pergunte somente decisões materiais que ainda estejam sem resposta, respeitando os limites abaixo.
Se a skill estiver indisponível, informe o impedimento e não simule seu uso.

Faça uma revisão de UI/UX do ChurchApp (app de gestão de igreja para pastores, líderes de
ministério e membros, muitos deles leigos e com mais de 50 anos) navegando de verdade.

**Endereço autorizado:** `http://localhost:3401` — o ChurchApp em **modo demonstração**
(`cd web && npm run demo -- --port 3401`). Somente este endereço. Não acesse
`churchapp.site`, a API de produção, a página publicada da prévia nem outros sites.

**Perfis e contexto (sem credenciais):** o modo demonstração não usa senha. A pílula
"Demonstração · Ver como" (canto inferior esquerdo) troca a pessoa logada:

| Persona | Quem é | Para que serve |
| --- | --- | --- |
| Pastor | Pr. Marcos, Igreja Batista Esperança, tudo configurado | Gestão: pessoas, ministérios, comunicação, configurações |
| Líder | Ana Paula, lidera o Louvor | Montar escalas, repertório, equipe do ministério |
| Membro | Lucas, violão no Louvor, com escalas sem resposta | Dia a dia: responder escala, oração, perfil |
| Igreja nova | Pr. Rafael, igreja recém-criada e vazia | Primeiro uso (checklist "Configure sua igreja") |
| Sem igreja | André, acabou de se cadastrar | Criar a igreja |
| Aguardando aprovação | Juliana, pediu para entrar | Tela de espera da aprovação |

Para automatizar a troca, grave `churchapp-demo:persona` no `localStorage` com
`pastor`, `lider`, `membro`, `nova`, `semigreja` ou `pendente`, antes de carregar a página.
"Recomeçar demonstração" (no mesmo menu) volta aos dados de exemplo.

**Jornadas e resultado esperado:**

| # | Persona | Tarefa | Resultado esperado |
| --- | --- | --- | --- |
| J1 | Membro | Confirmar a próxima escala pelo Início | Aviso "Presença confirmada"; a escala aparece como Confirmado |
| J2 | Membro | Em Escalas, avisar que não pode ir numa escala, com motivo | Selo "Não posso"; aviso de que a liderança foi avisada; dá para "Mudar resposta" |
| J3 | Membro | Abrir uma escala e ver ensaio, músicas e equipe | Folha da escala abre com essas seções; "Tocar sequência" funciona |
| J4 | Membro | Pedir oração **sem mostrar o nome** (Igreja › Fazer um pedido) | Pedido aparece em "Meus pedidos" como "Em revisão", marcado como anônimo |
| J5 | Membro | Marcar um dia em que não pode servir (Perfil) | Data aparece na lista com aviso de confirmação |
| J6 | Membro | Trocar para o tema escuro (Perfil › Minhas preferências) | App inteiro fica escuro e legível |
| J7 | Líder | Criar uma escala pelo botão "Nova escala" do cartão do ministério, com 2 pessoas | Aviso "Escala salva. A equipe foi avisada."; escala aparece em Escalas › Organizar |
| J8 | Líder | Abrir o ministério e percorrer Início, Escalas, Repertório e Pessoas | Cada aba carrega; ações claras; nada vazio sem explicação |
| J9 | Pastor | Aprovar um pedido de entrada (Gestão › Pessoas › Pendentes) | Pessoa sai de Pendentes e vira membro |
| J10 | Pastor | Adicionar um visitante (Pessoas › Adicionar pessoa) e registrar um contato no perfil dele | Visitante aparece em Visitantes; o contato entra no histórico |
| J11 | Pastor | Criar um ministério pelo assistente (Ministérios › Novo ministério) | Ministério criado; o app oferece "Adicionar pessoas" |
| J12 | Pastor | Montar um "Novo comunicado" em Comunicar **até a prévia, sem enviar** | Contagem de destinatários visível, com visitantes sem autorização fora |
| J13 | Pastor | Configurar um horário de culto (Configurações da igreja › Horários) | Horário salvo e listado |
| J14 | Igreja nova | Avançar o checklist "Configure sua igreja" (horários, 1º ministério, convite) | Cada passo abre a tela certa e fica marcado como feito |
| J15 | Sem igreja | Criar a igreja | Cai no Início com o checklist |
| J16 | Aguardando | Ver a tela de espera | Explica que o pedido está com o pastor e oferece "Verificar agora" |

Entregue diagnóstico e recomendações com evidências. Não altere código, dependências, configurações
ou dados existentes. Navegue e realize apenas operações de teste com dados fictícios e efeitos limitados
ao ambiente autorizado (no modo demonstração tudo fica no `localStorage` do navegador de teste).
Não efetue pagamentos (não clique em "Assinar"), não envie mensagens (pare o comunicado na prévia) e
não acione operações irreversíveis fora do modo demonstração.

### 1. Preparar a navegação

Leia `CLAUDE.md`, o contrato visual `DESIGN.md`, a proposta `docs/redesign/proposta.md` e os tokens
em `web/app/assets/css/theme.css`. Entenda os fluxos e confirme que `http://localhost:3401` responde
antes de interagir. Não amplie a revisão para outros sites ou ambientes.

Verifique se Agent Browser está disponível (`agent-browser skills get core`, quando suportado, e a
documentação oficial). **Se não estiver instalado, use o Playwright com o Chromium que já vem instalado
neste ambiente** (`require('playwright')`, `chromium.launch()`), sem instalar nada novo. Registre qual
ferramenta foi usada. Use uma sessão/contexto de navegador próprio para a revisão.

Se o navegador ou a aplicação estiver indisponível, informe o bloqueio. Uma inspeção de código pode
complementar o trabalho, mas não deve ser apresentada como uma navegação que não aconteceu.
Não instale ferramentas nem contrate serviços como consequência desta revisão.

Não há login com senha no modo demonstração. Não copie estados do navegador para arquivos públicos.

### 2. Executar as jornadas

Percorra cada jornada desde a entrada até o resultado esperado. Use snapshots atuais (árvore de
acessibilidade ou DOM) para identificar elementos e capturas de tela para registrar o resultado
visual; atualize as referências depois de mudanças de página ou estado. Registre o que foi observado
em vez de deduzir pelo código.

Verifique orientação ("onde estou, o que faço agora"), nomes de ações, hierarquia de informações,
consistência com o `DESIGN.md` e clareza das mensagens para quem é leigo. Observe estados vazios,
carregamento, sucesso, erro e validação quando alcançáveis (ex.: salvar formulário vazio).

Repita os pontos relevantes nestas dimensões, registrando as medidas:

- celular: 390×844 (iPhone) e 360×740 (Android pequeno);
- tablet: 820×1180 (iPad em pé, barra de baixo) e 1024×768 (iPad deitado, barra lateral);
- computador: 1280×800 e 1440×900, e 1920×1080 no tema escuro.

Procure cortes, rolagem horizontal inesperada, controles inacessíveis, texto pequeno demais (menos de
16px no corpo), alvos de toque abaixo de 44px e perda de informação.

Teste navegação por teclado, ordem de foco, foco visível, rótulos de campos, abertura e fechamento de
janelas e folhas (Esc, botão Fechar, foco voltando ao botão de origem) e recuperação de erros. Se houver
ferramenta compatível já instalada, use análise automatizada de acessibilidade como complemento e
confirme os achados.

Inspecione erros de console e requisições relevantes ao fluxo (no modo demonstração, avisos
`[demo] sem handler` indicam uma tela chamando algo que a simulação não conhece). Não transforme a
revisão em teste de carga ou auditoria ofensiva de segurança.

### 3. Confirmar e priorizar

Reproduza cada problema importante e localize a provável origem no código (`web/app/pages`,
`web/app/components`, `web/composables`). Separe falhas funcionais, barreiras de acessibilidade,
dificuldades de uso e preferências visuais.

Para cada achado, informe: página e jornada, dimensão da tela, passos, resultado esperado e observado,
impacto para o usuário, evidência (captura/snapshot) e sugestão concreta de correção. Evite
recomendações genéricas como "melhorar o layout" sem indicar o problema observado.

Uma análise automatizada ou um snapshot não comprova acessibilidade completa. Declare o que depende
de avaliação humana, de leitor de tela (VoiceOver/TalkBack) ou de ambientes não testados (iPhone e
Android reais, Safari).

### 4. Entregar

Entregue as jornadas concluídas e bloqueadas, os achados priorizados e uma ordem sugerida de correção.
Registre a ferramenta usada e as verificações realmente feitas.

Salve evidências num diretório privado fora do Git (ex.: `/tmp/churchapp-revisao-ux/`), só com dados
fictícios. Não publique capturas nem estados do navegador. Encerre apenas o servidor e as sessões de
navegador criados para esta revisão.

Não implemente as recomendações nesta execução. A próxima tarefa deve escolher o problema a corrigir e
repetir a jornada correspondente para verificar o resultado.
