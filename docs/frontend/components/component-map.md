# Frontend: Mapa de Componentes

Os componentes ficam em `web/app/components`.

## Layouts

### `layouts/main.vue`

Monta a casca da aplicacao logada:

- app bar;
- area principal;
- bottom navigation.

### `layouts/appBar/index.vue`

Cabecalho superior com usuario, igreja, alternancia de tema claro/escuro e notificacoes.

### `layouts/bottomNavigation/index.vue`

Menu inferior com as rotas principais.

## Dashboard

### `Dashboard/NextScheduleCard/index.vue`

Card de destaque com a proxima escala do usuario.

Estado atual:

- conteudo voltado ao resumo da proxima escala;
- visual em gradiente roxo.

### `Dashboard/quickAccess/index.vue`

Atalhos horizontais para areas do app.

Estado atual:

- atalhos devem apontar para as rotas reais do Nuxt;
- novas areas, como devocionais, ainda precisam de paginas dedicadas se virarem modulos do produto.

### `Dashboard/UpcomingEvents/index.vue`

Lista de proximos cultos/eventos.

Estado atual:

- eventos devem ser carregados a partir das escalas e contexto do usuario;
- link `Ver todos` deve navegar para a tela de escalas quando o fluxo estiver fechado.

## Escalas

### `Scale/ScheduleSection.vue`

Agrupa cards de escala por categoria/ministerio.

### `Scale/ScheduleCard.vue`

Mostra um evento de escala com:

- titulo;
- data;
- horario;
- voluntarios;
- acao de adicionar voluntario.

Estado atual:

- possui acoes de adicionar voluntarios, editar e excluir escalas quando o usuario tem permissao.

## Ministerios

### `Ministery/ListItem.vue`

Item clicavel usado na lista de ministerios.

### `Ministery/MusicCard/index.vue`

Card de musica com titulo, artista, tom, BPM e categoria.

### `Ministery/NewScaleModal.vue`

Modal para criar culto/evento de escala.

### `Ministery/NewMusicModal.vue`

Modal para criar musica.

### `Ministery/NewReferenceModal.vue`

Modal para criar tarefa/referencia.

Observacao:

- repertorio de louvor e integrado na pagina de detalhe do ministerio via endpoints de musicas.

## Admin

### `Admin/StatCard.vue`

Card generico para estatisticas.

### `Admin/MinisteryCard.vue`

Card usado para mostrar ministerios na tela de admin.

## Utils

### `utils/title.vue`

Wrapper simples para titulo de secao com slot de conteudo.
