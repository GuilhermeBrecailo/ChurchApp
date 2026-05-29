# Frontend: Paginas e Rotas

As rotas sao geradas automaticamente pelo Nuxt a partir da pasta `web/app/pages`.

## `/`

Arquivo:

- `web/app/pages/index.vue`

Tela inicial do usuario logado. Renderiza:

- `DashboardNextScheduleCard`;
- `DashboardQuickAccess`;
- `DashboardUpcomingEvents`.

Hoje todos os dados sao mockados nos componentes.

## `/login`

Arquivo:

- `web/app/pages/login.vue`

Tela publica de login. Usa o layout `notAppBottom`.

Estado atual:

- campos de email e senha;
- alternancia de visibilidade da senha;
- `handleLogin` autentica e carrega `/api/me`;
- link para `/register` orientado a pastor titular;
- link para `/forgot-password`, mas essa rota ainda nao existe.

## `/register`

Arquivo:

- `web/app/pages/register.vue`

Tela publica de cadastro. Usa o layout `notAppBottom`.

Estado atual:

- campos de nome, email, telefone, senha e confirmacao;
- cadastro publico cria sempre `Pastor titular`;
- validacao simples de igualdade entre senhas;
- `handleRegister` chama a API e volta para `/login`;
- membros devem ser criados pela area administrativa da igreja.

## `/scale`

Arquivo:

- `web/app/pages/scale.vue`

Tela de escalas gerais.

Mostra:

- titulo da pagina;
- botao `Novo`;
- filtros por ministerio;
- secoes de escalas;
- cards com evento, horario e voluntarios.

Estado atual:

- dados mockados em `schedulesData`;
- filtro local por categoria;
- botao `Novo` ainda nao abre fluxo real.

## `/ministery`

Arquivo:

- `web/app/pages/ministery/index.vue`

Lista ministerios e permite navegar para o detalhe.

Estado atual:

- ministerios mockados;
- botao `Ministerio` ainda nao abre cadastro;
- clique em um item navega para `/ministery/{id}`.

## `/ministery/[id]`

Arquivo:

- `web/app/pages/ministery/[id].vue`

Detalhe de um ministerio.

Mostra:

- botao de voltar;
- nome e lider do ministerio;
- abas de `Escalas`, `Musicas` e `Tarefas`;
- modal de criacao conforme a aba.

Estado atual:

- dados do ministerio sao buscados em um objeto local;
- musicas sao mockadas;
- formularios dos modais ainda nao salvam;
- os componentes dos modais parecem estar conectados em variaveis trocadas.

## `/user`

Arquivo:

- `web/app/pages/user.vue`

Tela de perfil do usuario.

Mostra:

- dados basicos do usuario;
- ministerio principal;
- funcao;
- indisponibilidades;
- sugestao;
- telefone;
- botao salvar.

Estado atual:

- dados fixos;
- salvar monta objeto local, escreve no console e mostra `alert`.

## `/admin`

Arquivo:

- `web/app/pages/admin.vue`

Tela administrativa da igreja.

Mostra:

- cards de estatisticas;
- area de membros;
- lista de ministerios.

Estado atual:

- numeros e ministerios mockados;
- botao convidar ainda nao abre fluxo real.
