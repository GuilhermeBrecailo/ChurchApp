Indice: Documentacao do Frontend

Esta documentacao descreve como o frontend do ChurchApp esta organizado e como o usuario navega pela aplicacao.

O front fica na pasta `web` e usa Nuxt 4, Vue 3, Vuetify, Tailwind CSS e icones do `lucide-vue-next`.

## 1. Arquitetura

Estrutura geral do projeto Nuxt, layouts, configuracao e convencoes visuais.

- [Arquitetura geral](architecture/overview.md)
- [Layouts e navegacao](architecture/layouts-navigation.md)

## 2. Telas

Fluxos principais acessados pelo usuario.

- [Paginas e rotas](screens/pages-routes.md)
- [Fluxo do usuario](screens/user-flow.md)

## 3. Componentes

Componentes reutilizaveis que montam dashboard, ministerios, escalas e administracao.

- [Mapa de componentes](components/component-map.md)

## 4. Estado e API

Estado compartilhado, autenticacao e integracao com o backend.

- [Estado, auth e integracao com API](state/api-auth.md)
- [Padrao de composables](state/composables.md)

## Observacoes atuais

- Login, cadastro, sessao, onboarding, membros, ministerios, escalas, admin, configuracoes da igreja e notificacoes ja possuem integracoes com a API em diferentes niveis.
- Ainda existem partes incompletas, principalmente alguns contadores do painel, fluxo de convite de membros e testes ponta a ponta.
- O CRUD principal de ministerios, escalas, tarefas, recursos, membros e dados da igreja esta integrado ao backend.
- O fluxo de convite ou solicitacao para membro entrar em uma igreja ainda precisa ser definido.
- Alguns documentos internos podem ficar atrasados em relacao ao codigo; use o codigo atual como fonte principal.
