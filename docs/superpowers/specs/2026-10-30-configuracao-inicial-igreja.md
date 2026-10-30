# Configuração inicial da igreja

## Objetivo

Na tela de cadastro, permitir escolher o perfil de pastor ou membro. O pastor cria a conta e segue para cadastrar a igreja; o membro solicita acesso com o código de convite da igreja. No cadastro da igreja, oferecer uma configuração rápida para que o ChurchApp já abra com ministérios úteis, sem obrigar a igreja a montar tudo naquele momento.

## Experiência

- O pastor escolhe entre configurar ministérios agora ou deixar para depois.
- A escolha de perfil aparece no cadastro: pastor segue para criar uma igreja; membro informa o convite e aguarda a aprovação da liderança.
- O cadastro de membro continua vinculado a um código de convite e não cria igreja.
- A opção inicial é configurar agora, com ministérios comuns pré-selecionados e editáveis.
- O pastor pode desmarcar sugestões e adicionar ministérios próprios.
- Cada tipo recebe módulos iniciais adequados; o pastor atual fica como responsável inicial e pode delegar depois.
- A escolha de configurar depois cria somente a igreja e mantém o caminho de configuração disponível dentro do app.

## Limites

- Preservar a criação de conta, autenticação, login e cadastro de membros.
- A entrada de configuração é opcional e retrocompatível para chamadas existentes da API.
- Criar a igreja, os ministérios selecionados e os vínculos iniciais numa única transação.
- Não adicionar dependências nem migrar o banco.

## Critérios de aceite

- As duas telas de criação de igreja oferecem a mesma configuração inicial.
- A tela `/register` deixa clara a escolha entre pastor e membro e encaminha cada perfil para o fluxo correspondente.
- O perfil membro usa o cadastro por convite existente e não chama a criação de igreja.
- Ministérios pré-selecionados podem ser removidos e ministérios personalizados podem ser adicionados.
- A API valida nomes, tipos e duplicidades antes de gravar.
- Se qualquer gravação falhar, a transação não deixa igreja sem a configuração selecionada.
- A opção “depois” não cria ministérios.
