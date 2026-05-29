# Frontend: Fluxo do Usuario

Este documento descreve o fluxo esperado da experiencia, considerando a estrutura atual do front.

## Fluxo publico

1. Usuario acessa `/login`.
2. Pastor titular sem conta navega para `/register`.
3. No cadastro publico, a conta criada e sempre de `Pastor titular`.
4. Apos cadastro bem-sucedido, volta para `/login`.
5. Apos login, o front carrega `/api/me` para saber papel e vinculo com igreja.
6. Membros nao se cadastram publicamente; recebem acesso criado pela igreja.

Estado atual:

- login e cadastro chamam a API;
- o middleware protege rotas internas;
- pastor sem igreja ve o card de criacao de igreja no `/`;
- membro sem igreja fica limitado ao `/` e `/user` ate ser vinculado.

## Fluxo de onboarding de igreja

1. Usuario autenticado sem igreja acessa `/`.
2. Se for `PASTOR`, visualiza formulario para criar igreja.
3. Ao criar igreja, o backend vincula `crunchId` ao usuario e define `userMainId` como pastor titular.
4. Se for `MEMBER`, fica bloqueado ate ser vinculado por um pastor ou usuario com permissao.
5. Usuario com igreja e redirecionado para `/`.

## Fluxo principal logado

1. Usuario com igreja entra no dashboard `/`.
2. Visualiza sua proxima escala.
3. Consulta atalhos rapidos.
4. Consulta proximos cultos/eventos.
5. Usa a bottom navigation para alternar entre Inicio, Escalas, Ministerios, Usuario e Admin.

## Fluxo de escalas

1. Usuario entra em `/scale`.
2. Filtra escalas por ministerio.
3. Visualiza cards de eventos.
4. Cada card mostra data, hora e voluntarios.

Estado atual:

- nao ha tela de detalhe de escala;
- botao de adicionar voluntario ainda nao executa acao;
- criacao de escala ainda nao esta conectada.

## Fluxo de ministerios

1. Usuario entra em `/ministery`.
2. Visualiza lista de ministerios.
3. Clica em um ministerio.
4. Vai para `/ministery/[id]`.
5. Alterna entre abas de Escalas, Musicas e Tarefas.
6. Abre modais para criar itens.

Estado atual:

- lista e detalhe usam mocks;
- modais ainda nao persistem dados;
- nomes dos componentes de modal precisam ser revisados para bater com a acao esperada.

## Fluxo de perfil

1. Usuario entra em `/user`.
2. Atualiza ministerio, funcao, indisponibilidades, sugestao e telefone.
3. Clica em salvar.

Estado atual:

- o salvar apenas exibe `alert`;
- nao ha integracao com endpoint de usuario;
- dados do usuario nao vem de auth/session.

## Fluxo administrativo

1. Usuario entra em `/admin`.
2. Consulta estatisticas da igreja.
3. Visualiza membros pendentes/aprovados.
4. Consulta ministerios.

Estado atual:

- membros sao listados pela API;
- pastor titular ou usuario com permissao pode adicionar membros;
- apenas o pastor titular pode conceder permissao para adicionar membros;
- estatisticas de ministerios, escalas e musicas ainda sao fixas.
