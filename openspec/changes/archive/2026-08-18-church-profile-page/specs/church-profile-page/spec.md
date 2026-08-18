## ADDED Requirements

### Requirement: Página pública de perfil da igreja
O sistema SHALL exibir a página `/church/[inviteCode]` sem exigir autenticação, mostrando logo, nome, cidade/estado, horários e botão de entrada.

#### Scenario: Acesso com código válido
- **WHEN** qualquer pessoa acessa `/church/[inviteCode]` com um código válido
- **THEN** o sistema exibe nome, logo, endereço e botão "Quero participar"

#### Scenario: Acesso com código inválido
- **WHEN** o código de convite não corresponde a nenhuma igreja
- **THEN** o sistema exibe mensagem "Igreja não encontrada"

### Requirement: Botão de entrada pré-preenche o código de convite
O sistema SHALL redirecionar o visitante para `/join?code=[inviteCode]` ao clicar em "Quero participar", com o código já preenchido no formulário de entrada.

#### Scenario: Clique em Quero participar
- **WHEN** o visitante clica em "Quero participar" na página pública
- **THEN** é redirecionado para a tela de cadastro/join com o código pré-preenchido

### Requirement: Pastor pode informar horários dos cultos
O sistema SHALL permitir ao pastor cadastrar os horários dos cultos como texto livre nas configurações da igreja, exibido na página pública.

#### Scenario: Horários cadastrados
- **WHEN** o pastor salvou horários no painel admin
- **THEN** a página pública exibe os horários informados

#### Scenario: Horários não cadastrados
- **WHEN** o pastor não cadastrou horários
- **THEN** a seção de horários não é exibida na página pública
