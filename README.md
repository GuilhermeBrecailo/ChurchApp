# AppChurch

AppChurch e um MVP fullstack para gestao de igrejas, ministerios, membros e escalas. A ideia do projeto e resolver uma dor real de organizacao interna: centralizar cadastro de igreja, membros, liderancas, ministerios, escalas de servico, disponibilidade dos voluntarios, tarefas e administracao.

O projeto foi construido como uma aplicacao real, com autenticacao, permissoes, banco relacional, frontend responsivo, API estruturada, integracao com Keycloak e ambiente local via Docker Compose.

## Visao geral do produto

O app atende tres visoes principais:

- Administrador da plataforma: acompanha igrejas cadastradas, usuarios, ministerios e detalhes gerais.
- Pastor: administra a propria igreja, cria membros, organiza ministerios, define liderancas e acompanha escalas.
- Lider ou membro: acessa as informacoes da igreja, participa de ministerios e visualiza ou gerencia escalas conforme permissao.

O foco do MVP foi demonstrar um produto realista, com regras de permissao no backend, experiencia responsiva no frontend e estrutura preparada para evoluir para uso em ambiente real.

## Destaques

- Autenticacao com Keycloak e JWT.
- Cadastro de pastor, igreja, membros e ministerios.
- Painel administrativo da plataforma para visualizar igrejas e detalhes.
- Painel administrativo da igreja para pastor e usuarios com permissao.
- Regras por perfil: administrador da plataforma, pastor titular, lider de ministerio e membro.
- Criacao e gerenciamento de escalas por ministerio.
- Controle de voluntarios nas escalas.
- Repertorio de louvor com letra, cifra, observacoes e anexo PDF.
- Ministerio infantil com cadastro de atividades em PDF.
- Upload protegido de PDF por ministerio, com validacao de permissao, tipo e tamanho.
- Regras de edicao: somente pastor e lider do ministerio alteram informacoes de ministerios e escalas.
- Perfil do usuario com ministerio principal, funcao, telefone e indisponibilidade.
- Redefinicao de senha obrigatoria para usuarios criados pelo pastor.
- Interface responsiva para login, navegacao, escalas, perfil do usuario e administracao pastoral.
- Estrutura de backend separada por dominio, aplicacao, infraestrutura e interfaces.
- Testes unitarios de dominio e entidades.
- PWA com manifest, service worker, cache basico e suporte inicial a notificacoes push.
- Landing publica por igreja (`/c/:slug`), sem autenticacao, com identidade visual propria (logo e cor de destaque), proximos cultos e feed de avisos/palavra do pastor/oracoes.
- Inscricao de notificacoes push anonima para visitantes da landing publica, sem exigir conta.
- Delegacao de gestao de escala e repertorio por ministerio: pastor ou lider titular pode designar outros membros do proprio ministerio como gestores, alem do lider unico.

## Stack

### Frontend

- Nuxt 4
- Vue 3
- TypeScript
- Vuetify
- Tailwind CSS
- Vue Router
- lucide-vue-next
- jwt-decode
- PWA via manifest e service worker customizado

### Backend

- Node.js
- TypeScript
- Fastify
- @fastify/multipart
- @fastify/static
- Prisma ORM
- PostgreSQL
- Keycloak
- Zod
- Jest
- jsonwebtoken
- jwks-rsa
- web-push

### Infraestrutura local

- Docker Compose
- PostgreSQL da aplicacao
- PostgreSQL separado para Keycloak
- Keycloak em modo desenvolvimento

## Perfis e permissoes

| Perfil | O que pode fazer |
| --- | --- |
| Admin da plataforma | Visualizar igrejas cadastradas, detalhes, usuarios e ministerios na tela administrativa global. |
| Pastor | Administrar a igreja dele, criar usuarios, criar ministerios, definir lideres e gerenciar escalas. |
| Lider de ministerio | Gerenciar informacoes e escalas do ministerio em que lidera. |
| Gestor delegado | Membro designado pelo pastor ou pelo lider titular para gerenciar escala e repertorio de um ministerio especifico, sem ser o lider titular dele. |
| Membro | Visualizar suas informacoes, ministerios e escalas, sem alterar escalas ou ministerios. |
| Visitante (publico) | Acessa a landing publica da igreja (`/c/:slug`) sem login: ve proximos cultos, avisos publicos e pode ativar notificacoes daquela igreja. |

## Arquitetura

```text
.
├── api/
│   ├── src/domain/                 # Entidades, value objects e regras de dominio
│   ├── src/application/            # Casos de uso e servicos
│   ├── src/infrastructure/         # Prisma, Keycloak e repositorios
│   ├── src/interfaces/             # Rotas HTTP, adapters e plugins
│   └── tests/                      # Testes unitarios
├── web/
│   ├── app/pages/                  # Paginas Nuxt
│   ├── app/components/             # Componentes de UI
│   ├── app/middleware/             # Middleware de autenticacao
│   └── composables/                # Integracao com API e estado
├── docs/                           # Documentacao interna
├── docker-compose.yml              # Ambiente local
├── .env.example                    # Variaveis de ambiente de exemplo
└── package.json                    # Scripts de apoio da raiz
```

## Principais fluxos implementados

### Autenticacao e sessao

- Login com Keycloak.
- Refresh token via cookie HTTP only.
- Logout.
- Middleware global protegendo rotas privadas no frontend.
- `GET /api/me` para carregar contexto do usuario autenticado.
- Redirecionamento para onboarding quando o pastor ainda nao tem igreja.
- Redirecionamento para perfil quando o usuario precisa redefinir a senha.

### Administracao

- Admin da plataforma visualiza todas as igrejas.
- Lista de igrejas com scroll lateral e painel de detalhes com usuarios e ministerios.
- Pastor administra a propria igreja.
- Permissao separada para membros que podem gerenciar usuarios.
- Clique em usuario abre detalhes.

### Membros e senha

- Pastor ou usuario autorizado cria membros.
- Usuario criado pelo pastor recebe senha inicial e fica marcado com `mustChangePassword`.
- Ao logar, esse usuario e levado para a pagina de perfil.
- Modal persistente obriga a redefinicao da senha.
- A nova senha e atualizada no Keycloak e a pendencia e removida no banco.

### Ministerios e escalas

- Criacao e listagem de ministerios.
- Definicao de lider do ministerio.
- Detalhe do ministerio com abas para escalas, tarefas, recursos, musicas e aulas quando aplicavel.
- Pastor titular e lider do ministerio podem gerenciar escalas.
- Membro comum nao altera escalas.
- Voluntarios podem ser vinculados a uma escala com uma funcao.
- Ministerios de louvor podem salvar musicas com PDF anexo.
- Ministerios infantis podem salvar atividades/aulas com PDF anexo.

### PDFs e materiais

- A API disponibiliza `POST /api/church/departments/:id/uploads/pdf` para upload de PDF.
- O endpoint exige usuario autenticado e permissao para gerenciar o ministerio.
- Apenas arquivos `application/pdf` sao aceitos.
- O limite atual e de 10 MB por arquivo.
- Em desenvolvimento local, os arquivos ficam em `api/uploads` e sao servidos por `/uploads/...`.
- O banco nao armazena o binario do PDF: guarda apenas `url`, `key`, nome, MIME type e tamanho no `metadata` do `MediaItem`.
- Para louvor, o PDF fica em `metadata.pdf` da musica.
- Para ministerio infantil, atividades sao `MediaItem` com `category: ACTIVITY` e `url` apontando para o PDF.
- Para producao, a recomendacao e trocar o armazenamento local por S3, Cloudflare R2, MinIO ou outro storage compativel, mantendo o mesmo contrato de retorno do upload.

### Perfil do usuario

- Edicao de telefone.
- Ministerio principal.
- Funcao no ministerio.
- Datas de indisponibilidade.
- Sugestoes para liderancas.
- Redefinicao manual de senha.

## Como subir o app localmente

### 1. Requisitos

- Docker e Docker Compose
- Node.js 20+ para rodar scripts fora do Docker
- npm

### 2. Criar o `.env`

Copie o exemplo:

```bash
cp .env.example .env
```

Um exemplo funcional para desenvolvimento local:

```env
DB_USER=igreja_user
DB_PASSWORD=igreja_password
DB_NAME=igreja_db
DB_PORT=5433

API_PORT=8000
WEB_PORT=3000
NODE_ENV=development
NUXT_PUBLIC_URL_BACKEND=http://localhost:8000

KEYCLOAK_REALM=clientA
KEYCLOAK_ADMIN_REALM=master
KEYCLOAK_CLIENT_ID=admin-cli
KEYCLOAK_CLIENT_USER_ID=clientA
KEYCLOAK_USER=admin
KEYCLOAK_PASSWORD=admin
KEYCLOAK_GRANT_TYPE=password
KEYCLOAK_SECRET_KEY=
KEYCLOAK_CLIENT_UUID=

VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
```

Se for acessar o frontend por outro aparelho da rede ou pelo IP da maquina, troque o backend publico para o IP local:

```env
NUXT_PUBLIC_URL_BACKEND=http://192.168.1.9:8000
```

Nesse caso, acesse a web tambem pelo IP:

```text
http://192.168.1.9:3000
```

As variaveis VAPID podem ficar vazias no primeiro teste local. Para usar push notifications, gere as chaves:

```bash
cd api
npx web-push generate-vapid-keys
```

### 3. Subir containers

```bash
docker compose up --build
```

Na primeira subida, o container da API instala dependencias, executa migrations do Prisma e gera o client do Prisma automaticamente.

Servicos:

- Web: `http://localhost:3000`
- API: `http://localhost:8000`
- Keycloak: `http://localhost:8080`
- Banco da aplicacao: `localhost:5433`

### 4. Configurar Keycloak

Entre no Keycloak:

```text
URL: http://localhost:8080
Usuario: admin
Senha: admin
```

Crie/configure:

1. Realm: `clientA`
2. Client: `clientA`
3. Client authentication: desativado para fluxo publico local, ou ajuste as variaveis caso use secret.
4. Standard flow: habilitado.
5. Direct access grants: habilitado.
6. Valid redirect URIs: `http://localhost:3000/*`
7. Web origins: `http://localhost:3000` ou `*` em desenvolvimento.

Depois disso, a API consegue autenticar usuarios e criar contas via Keycloak Admin.

Se estiver acessando pela rede local, inclua tambem:

```text
Valid redirect URIs: http://192.168.1.9:3000/*
Web origins: http://192.168.1.9:3000
```

### 5. Acessar a aplicacao

Abra:

```text
http://localhost:3000
```

Fluxo sugerido para demonstracao:

1. Cadastre um pastor.
2. Crie uma igreja no onboarding.
3. Acesse o admin da igreja.
4. Crie um membro com senha inicial.
5. Faca login com esse membro.
6. Veja a tela obrigatoria de redefinicao de senha.
7. Crie ministerios e defina lider.
8. Crie escalas e adicione voluntarios.
9. Teste a visao de lider e membro comum.

## Rodando sem Docker

### API

```bash
cd api
npm install
npm run prisma:generate
npm run prisma:deploy
npm run dev
```

### Web

```bash
cd web
npm install
npm run dev
```

Para rodar sem Docker, a API ainda precisa de um PostgreSQL acessivel e de um Keycloak configurado. Ajuste `DATABASE_URL`, `KEYCLOAK_BASE_URL` e as variaveis do Keycloak conforme o seu ambiente.

## Demonstracao sugerida

Para apresentar o projeto para recrutadores ou pessoas tecnicas, uma boa ordem e:

1. Mostrar o login e explicar que a autenticacao passa pelo Keycloak.
2. Entrar como pastor e mostrar a administracao da igreja.
3. Criar ou abrir um ministerio e destacar a regra de lideranca.
4. Mostrar a criacao de escala e o controle de voluntarios.
5. Entrar como membro comum e mostrar que ele nao consegue editar escalas.
6. Criar um usuario pelo pastor e mostrar a redefinicao obrigatoria de senha no primeiro acesso.
7. Abrir a tela pelo mobile para evidenciar responsividade e PWA.

## Dados de teste

O projeto permite criar dados pelo proprio fluxo da aplicacao. Para um ambiente de demonstracao, cadastre:

- Uma igreja com nome realista.
- Um pastor titular.
- Tres a cinco ministerios, por exemplo Louvor, Midia, Recepcao, Intercessao e Jovens.
- Alguns membros com funcoes diferentes.
- Um lider por ministerio.
- Escalas com datas futuras e voluntarios vinculados.

Se o banco local ja tiver os dados criados durante os testes, use os acessos compartilhados no ambiente local. Caso o banco seja recriado, os usuarios precisam ser cadastrados novamente porque eles tambem dependem do Keycloak.

## Scripts uteis

Na raiz do projeto:

```bash
npm run api:test
npm run api:typecheck
npm run web:build
npm run validate
```

Na API:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:studio
npm run test:ci
```

## Testes e build

Testes da API:

```bash
npm run api:test
```

Build do frontend:

```bash
npm run web:build
```

Validacao completa configurada na raiz:

```bash
npm run validate
```

Observacao: dependendo do ambiente, o build do Nuxt pode exibir warnings de CSS relacionados a Vuetify/Tailwind durante a minificacao. O build segue sendo gerado.

## Roadmap

- Criar seeds versionadas para demonstracao.
- Automatizar configuracao inicial do Keycloak.
- Criar testes de integracao para endpoints principais.
- Criar pipeline de CI.
- Evoluir notificacoes push para eventos reais de escala.
- Melhorar convite/vinculo de membros por email ou codigo.
- Adicionar screenshots e video curto de demonstracao.
- Preparar deploy publico.

## Resumo para recrutadores

Este projeto demonstra uma aplicacao fullstack em TypeScript com frontend moderno em Nuxt/Vue, backend em Fastify, ORM com Prisma, banco PostgreSQL, autenticacao externa com Keycloak, controle de permissoes, Docker Compose, testes automatizados e uma estrutura de codigo organizada por responsabilidades.

Mais do que uma tela bonita, o AppChurch mostra regras reais de produto: pastor administra a propria igreja, lider gerencia apenas o ministerio dele, membro comum nao altera escalas, usuarios criados pelo pastor precisam redefinir senha no primeiro acesso e a experiencia funciona em desktop e mobile.
