# Mapa de fluxos do ChurchApp (antes do redesign)

Levantamento feito lendo todo o front (`web/`) em 11/11/2026, já com o
acompanhamento de visitantes que entrou na `main`. Serve de base para o
redesign: **como o app funciona hoje**, para quem e onde ele trava.

O app tem 45 telas e cerca de 90 componentes. As telas mais pesadas são
`ministery/[id].vue` (2.900 linhas), `platform-admin.vue` (2.400),
`admin/pessoas.vue` (2.300) e `admin/configuracoes.vue` (1.800).

---

## 1. Quem usa e o que cada um enxerga

O front não tem um papel "Líder" de verdade. Ele deduz três níveis
(`app/utils/roleNavigation.ts`):

| Nível | Quem é | Barra inferior (celular) |
| --- | --- | --- |
| **Privilegiado** | PASTOR, ADMIN, SUPER_ADMIN, `is_admin` | Início · Pastoral · Cultos · Escalas · Mais |
| **Líder** | membro com algum cargo que dá permissão (ou o antigo `canManageMembers`) | Início · (Ministérios, Pessoas ou Conteúdo, conforme o cargo) · Escalas · Cultos · Mais |
| **Membro** | todo o resto | Início · Cultos · Escalas · Ministérios · Mais |

- **Permissões:** são 20 permissões finas (`usePermissions.ts`), agrupadas em
  cargos criados pelo pastor (Admin › Pessoas › Cargos). Um cargo vale para um
  ministério ou para a igreja toda.
- **Pré-visualização:** o pastor pode ver o menu "como membro" ou "como
  líder" (Configurações › Geral). Só o menu muda.
- **Menu "Mais":** repete todos os atalhos, agrupados em Rotina, Conteúdo e
  cuidado, Gestão e Conta. Para o membro, **Conteúdo, Oração e Perfil só
  existem dentro do "Mais"**.
- **`/igreja`:** um hub em grade que nenhum link do app abre.

---

## 2. Entrada no app

| Rota | Para quem | O que faz |
| --- | --- | --- |
| `/comece` | deslogado (é para onde `/` manda quem não entrou) | Página de vendas. Todos os botões levam a `/register` |
| `/login` | deslogado | E-mail + senha. Diz "se você é membro, peça para sua igreja criar seu acesso" |
| `/register` | pastor ou membro | Escolhe "Sou pastor" / "Sou membro" (este pede código de convite) |
| `/join?code=` | quem recebeu o link de convite | Código → formulário → "cadastro enviado"; logado, entra direto |
| `/forgot-password` | todos | **Beco sem saída**: só diz "fale com a liderança" |
| `/onboarding/church` | logado sem igreja | Cria a igreja (pastor) ou entra por código. Quase órfã: o Início tem o mesmo formulário |
| `/c/[slug]` | público | Página da igreja: cultos da semana, avisos, devocionais, contatos |
| `/plans` | igreja logada | Free × Pro, checkout no Mercado Pago |

**Jornadas como estão hoje**

1. **Pastor do zero:**
   - `/comece` → `/register` → entra sozinho → Início com o formulário "Crie sua igreja".
   - Ao mesmo tempo abre o **guia de boas-vindas do membro** e, no celular, o banner "Instale o app".
   - Criada a igreja, o Início vira "Primeiros passos" até existir um 2º membro, mesmo que ele já tenha criado ministérios.
2. **Membro pelo link de convite:**
   - Deslogado: `/join` → cadastro → fica **pendente** → entra e vê "Aguardando aprovação".
   - Já logado e sem igreja: o mesmo código o põe dentro **na hora**, sem aprovação. São regras diferentes para o mesmo convite.
3. **Membro criado pelo pastor:**
   - O pastor define uma senha temporária. No primeiro login o app força `/user` com o diálogo "Redefinir senha".
   - Depois de trocar, a pessoa fica parada no Perfil e o destino original se perde.
4. **Visitante na página pública:**
   - Vê o aviso de notificações aos 2 s e o banner de instalação aos 3,5 s.
   - Não existe nenhum "quero participar / tenho um convite".
5. **Esqueci a senha:** não há recuperação, nem para o pastor.

---

## 3. Dia a dia do membro

### Início (`/`)

Coluna principal, na ordem:

1. **Sua rotina (TodayCard):** o que acontece hoje na igreja.
2. **Minha próxima escala:** com Confirmar / Talvez / Não posso.
3. **Próxima escala da igreja:** escondida se a escala é minha.
4. **Cuidado pastoral:** só com permissão.
5. **Próximas escalas:** 5 escalas da igreja toda.

Coluna lateral: Atalhos, Avisos (máx. 3, cortados), Versículo do dia e
Pedidos de oração (últimos 7 dias).

> As escalas aparecem **4 vezes** no Início e são buscadas **3 vezes** do
> mesmo endpoint, que devolve todas as escalas da igreja, de todo o histórico.

### Escalas (`/scale`)

- **Lista:** Próximas / Histórico, chips por ministério e cartões agrupados.
- **Ao tocar num cartão:** abre a folha de detalhes, com:
  - "Sua resposta": Vi / Confirmar / Não posso / Troca;
  - a equipe;
  - o ensaio;
  - o louvor, com leitor de cifra e "Tocar sequência";
  - os recursos.
- **Para quem gerencia algum ministério:** "Novo", números (Pendentes / Não
  viram / Trocas), editar, voluntários e envio ao Holyrics.

### Outras telas

| Tela | Conteúdo |
| --- | --- |
| **Perfil** (`/user`) | Dados, telefone, meus ministérios, **indisponibilidade** (salva na hora), senha, sair |
| **Notificações** | Lista, marcar como lida, abre o link da notificação |
| **Oração** | Novo pedido (pode ser anônimo) → revisão do pastor → aparece na lista. O pastor tem Comunidade/Pendentes |
| **Conteúdo** | 4 cartões: Versículo, Bíblia (NVI/ACF/ARA/NVT + nota particular), Devocionais (capítulos, progresso, comentários), Minha playlist (tom pessoal) |
| **Configurações** (`/settings`) | Só o cadastro da igreja. O membro vê o formulário desabilitado |

### Jornadas do membro

1. **Responder a uma escala:** dá para responder em 3 lugares, com regras diferentes:
   - **Início:** Confirmar / **Talvez** / Não posso, com o motivo num campo dentro do cartão. Depois de responder, não dá para mudar.
   - **Escalas:** Vi / Confirmar / Não posso, com o motivo numa janela / **Troca**. Não tem "Talvez", e quem respondeu "Talvez" aparece como "Pendente".
   - **Push:** abre `/scale` e só rola até o cartão. A folha não abre sozinha.
2. **Indisponibilidade:** fica em Perfil › Indisponibilidade › data › "+". Nada em Escalas aponta para lá.
3. **Oração anônima:** depois de enviar, o pedido some até ser aprovado. Não existe "meus pedidos" e o membro nunca fica sabendo de uma recusa.
4. **Tema e notificações:** só pelo sol/lua e pelo sino no topo. Não há uma tela de preferências.

---

## 4. Ministérios e cultos (líder)

### O que é um ministério

**Tipo:** Louvor, Infantil, Recepção, Mídia, Intercessão, Diaconato ou Outro.
O tipo define um **modelo de escala** (campos, funções padrão, checklist,
Santa Ceia).

**Módulos ligáveis:** cada um vira uma aba.

| Módulo | O que traz |
| --- | --- |
| Escalas | escalas do ministério |
| Tarefas | sem prazo e sem como concluir |
| Recursos | links e PDFs |
| Músicas | Cifra Club, importar PDF, medley, tom pessoal |
| Aulas | PDFs de atividades |

O Infantil ganha ainda a aba **Crianças** (cadastro e chamada).

### Telas

- **`/ministery`:** lista os meus ministérios (o pastor vê todos) e tem "Novo".
- **`/ministery/[id]`:** cabeçalho + resumo e as abas:
  - **Visão geral:** só as 3 próximas escalas;
  - **Líder:** membros, cargos, pendências, lembretes;
  - Escalas, Tarefas, Recursos, Músicas, Aulas, Crianças.
- **`/admin/ministerios`:** **outro** formulário de ministério, sem módulos e sem "ativo".
- **`/cultos`:** agenda (os cultos fixos geram ocorrências, e há cultos avulsos).
- **`/cultos/[id]`:** abas Escalas (um botão por ministério), Visitantes (contagem + "Finalizar culto") e Membros (presença nome a nome).

### Jornadas do líder

1. **Montar uma escala:** em Escalas › Nova, ou a partir de um culto, que abre o formulário já preso àquele culto.
   - A pessoa preenche as funções do modelo e escolhe as pessoas. Salvar dispara 2 a 3 chamadas.
   - Quem foi escalado recebe push. Na edição, os que não mudaram provavelmente recebem 2 pushes.
2. **Repertório:**
   - As músicas são cadastradas na aba Músicas e escolhidas no formulário da escala, na ordem em que se toca nelas.
   - **Ordem, "quem começa", observações e Holyrics só existem na folha de `/scale`, não no ministério.**
3. **Crianças:** cadastrar a criança, criar a chamada e marcar presente ou ausente. A chamada não se liga ao culto.

### Problemas desta área

- **Editores de escala duplicados:**
  - Dois **editores de escala** (`Ministery/ScheduleFormDialog` × `Scale/FormDialog`) com recursos diferentes.
  - Dois **diálogos de voluntários** com regras diferentes: um aceita a mesma pessoa duas vezes e pega as funções do modelo; o outro junta as funções em "A · B" e pega as funções de uma lista fixa.
- **Diálogo de voluntários:** mistura montar a equipe (antes do culto) com marcar presença (depois).
- **Página do ministério:**
  - Carrega 8 conjuntos de dados ao abrir, inclusive todos os membros da igreja, seja qual for o módulo ativo.
  - Mostra só 1 escala por padrão, sem ordem por data.
- **Módulos:** não dá para mudar os módulos depois de criar o ministério.
- **Bugs:**
  - **Bug:** no editor de modelo, as condições de "Tarefas para conferir" e "Santa Ceia" estão trocadas (`DepartmentScheduleConfigFields.vue:80,116`).
  - **Bug:** a aba Recursos usa a permissão de músicas (`ResourcesTab.vue:17,83`).
  - **Bug:** "Adicionar escala" e "Finalizar culto" não checam permissão na tela de culto.

---

## 5. Gestão e cuidado (pastor / admin)

| Tela | Seções |
| --- | --- |
| `/admin` | 4 números + 6 atalhos |
| `/admin/pessoas` | **Membros** (contas, pendentes, adicionar com senha temporária, detalhe com cargos) · **Cargos** (permissões, modelos prontos) · **Rol** (visitante / membro / desligado, sem conta) |
| `/admin/configuracoes` | Geral (convite + QR, pré-visualizar menu) · WhatsApp · Integrações (Holyrics) · Página pública (logo, cores, fonte, contatos) · Horários · Plano |
| `/settings` | Cadastro da igreja (nome, endereço, documento), com **outro** envio de foto |
| `/admin/mensagens` | Modelos · Enviar agora · Regras automáticas pós-culto · Histórico · Aniversariantes (tudo por WhatsApp) |
| `/admin/publicacoes` | Um formulário que alterna Aviso / Versículo / Devocional / Publicação + lista do que foi publicado |
| `/admin/relatorios` | Confirmação / Presença / Membros + relatório pastoral + **registrar público do culto** |
| `/pastoral` | Painel: quem precisa de atenção, visitas, pedidos de oração |
| `/pastoral/pessoas` | Lista derivada do painel (no máx. 8 ausentes) + perfil com linha do tempo |
| `/pastoral/visitas` | Visitas: agendar, concluir |
| `/pastoral/visitantes` | Funil de visitantes: Novo → Contatado → Voltou → Encerrado |
| `/platform-admin` | Igrejas, planos, usuários, leads comerciais, vídeos de ajuda |

**Sobreposições**

- **"Pessoas" está em 4 lugares:** Admin Membros (contas), Admin Rol, Pastoral Pessoas e Pastoral Visitantes. Há **dois formulários de "novo visitante"**.
- **Configuração da igreja espalhada em 3 telas:** Configurações (6 abas), `/settings` (cadastro) e `/plans`. O mesmo lugar se chama "Integrações", "Configurações" e "Cadastro".
- **"Presença" com dois sentidos:** a de voluntários (relatório) e o público do culto (registrado dentro de Relatórios e também em Cultos).
- **Painel pastoral repetido:** aparece em `/pastoral` e no cartão do Início.

**Bugs e riscos encontrados**

- **Oração:** a aba Pendentes só aparece para PASTOR/ADMIN (`prayer.vue:354`). Quem tem a permissão de oração não consegue moderar, embora a API deixe.
- **Visitantes:** o botão "Registrar visitante" fica fora da checagem de permissão (`visitantes.vue:13`).
- **Erros que não aparecem:**
  - ao salvar horários (`configuracoes.vue`);
  - ao dar ou tirar um cargo (`pessoas.vue`).
- **Ações destrutivas sem confirmação:**
  - apagar publicação, modelo, regra, horário ou registro do rol;
  - desconectar o WhatsApp;
  - gerar um novo código de convite;
  - "Enviar agora", que não mostra quantas pessoas vão receber.
- **Tipo do membro:** o seletor só oferece "Membro" ou "Pastor", então um ADMIN aparece como "Membro".
- **Admin da plataforma:** oferece os cargos da própria igreja do admin para usuários de qualquer outra igreja.

---

## 6. Problemas que atravessam o app todo

1. **Duas regras de navegação:**
   - O mesmo destino aparece na barra, nos Atalhos do Início, no "Mais" e no hub `/igreja` (que é órfão).
   - Para o membro, o que é espiritual (Conteúdo, Oração) fica escondido no "Mais".
2. **Escala é o coração do app e está fragmentada:**
   - 4 cartões no Início, a lista em Escalas, a aba no ministério e a aba no culto.
   - 2 editores, 2 diálogos de voluntários e 3 jeitos de responder.
   - O vocabulário de status também diverge: "Talvez" × "Pendente".
3. **Pessoas e configurações espalhadas** (ver seção 5).
4. **Padrões visuais misturados:**
   - 4 estilos de título de seção só no Início.
   - Botão "voltar" em algumas telas e não em outras.
   - Abas em 3 estilos (botões segmentados, chips, `v-tabs`).
   - Diálogos em `v-dialog` × `ResponsiveOverlay`.
   - Cores fixas que quebram o tema escuro (devocionais, onboarding).
5. **Mistura de "salva na hora" com "precisa clicar em Salvar"** na mesma tela: Perfil e detalhe do membro.
6. **Recursos do plano Pro espalhados:** cadeados em lembretes, importação de PDF, Cifra Club, recursos, cargos e relatórios, sem explicar no contexto o que se ganha.

---

## 7. Direções para o redesign (proposta, a validar)

1. **Navegação por intenção, e não por módulo:**
   - Membro: **Início · Minhas escalas · Igreja** (cultos, conteúdo, oração, avisos) **· Perfil**.
   - Líder: o mesmo + **Ministérios**.
   - Pastor: **Início · Pessoas · Agenda** (cultos + escalas) **· Ministérios · Mais**.
2. **Início como lista do que fazer ("Para você"):**
   - Uma fila única de ações: responder escala, aprovar pedido, ligar para um visitante, escala sem gente…
   - Em seguida, "hoje na igreja".
   - Sai a repetição de escalas.
3. **Uma escala só, com um modelo de dados, uma folha e um editor:**
   - A mesma folha em todo lugar: responder, equipe, repertório (com ordem e Holyrics), recursos.
   - O mesmo editor no ministério, no culto e em Escalas.
   - Status padronizado: Pendente · Confirmado · Talvez · Não posso · Pediu troca.
4. **Pessoas num lugar só:**
   - Uma tela com filtros (Membros com conta, Rol, Visitantes, Em cuidado, Pendentes) e um perfil único da pessoa.
   - O perfil reúne dados, cargos, ministérios, visitas, funil e contato.
5. **Ministério por módulos de verdade:**
   - Cada aba carrega os próprios dados.
   - A Visão geral vira um resumo útil.
   - Os módulos passam a ser editáveis.
6. **Configurações em dois lugares claros:**
   - **Igreja:** cadastro, página pública, horários, convite, integrações, plano.
   - **Minhas preferências:** tema (claro / escuro / sistema), notificações, senha.
7. **Entrada:**
   - "Tenho um convite" na tela de login e na página pública.
   - Recuperação de senha.
   - Boas-vindas diferentes para pastor e membro.
   - Depois de trocar a senha, a pessoa volta para onde ia.
8. **Sistema visual:**
   - Um cabeçalho de página (voltar + título + ajuda + ação principal), um estilo de título de seção, um tipo de overlay e um estilo de abas.
   - Confirmação em toda ação destrutiva.
   - Tema escuro sem cores fixas.
