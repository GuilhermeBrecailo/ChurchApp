## ADDED Requirements

### Requirement: Coletar motivo ao declinar escala
Quando um voluntário clicar em "Não posso" na escala, o sistema SHALL exibir um dialog modal com um campo de texto para que ele descreva o motivo da ausência antes de confirmar a ação.

#### Scenario: Dialog exibido ao clicar em "Não posso"
- **WHEN** o usuário clica no botão "Não posso" em uma escala
- **THEN** um dialog modal é aberto com título "Por que você não pode ir?", campo de texto (textarea) e botões "Cancelar" e "Confirmar"

#### Scenario: Envio com motivo preenchido
- **WHEN** o usuário preenche o motivo e clica em "Confirmar" no dialog
- **THEN** a ação DECLINED é enviada ao backend junto com o texto do motivo

#### Scenario: Envio sem motivo (campo opcional)
- **WHEN** o usuário deixa o campo vazio e clica em "Confirmar" no dialog
- **THEN** a ação DECLINED é enviada ao backend sem motivo (campo nulo)

#### Scenario: Cancelar sem declinar
- **WHEN** o usuário clica em "Cancelar" ou fecha o dialog
- **THEN** nenhuma ação é enviada ao backend e o status da escala permanece inalterado

### Requirement: Persistir motivo de recusa no banco de dados
O sistema SHALL armazenar o motivo de recusa no campo `declineReason` do registro `ScheduleAssignment` quando a ação for `DECLINED`.

#### Scenario: Salvar motivo no banco
- **WHEN** o endpoint `PATCH /api/church/schedules/:id/my-assignment` recebe `action: "DECLINED"` com `declineReason`
- **THEN** o campo `declineReason` é salvo no `ScheduleAssignment` correspondente

#### Scenario: Campo nulo quando sem motivo
- **WHEN** o endpoint recebe `action: "DECLINED"` sem `declineReason`
- **THEN** o campo `declineReason` é salvo como `null` no banco

#### Scenario: Campo limpo ao confirmar presença
- **WHEN** o endpoint recebe `action: "CONFIRMED"` para um assignment que tinha `declineReason`
- **THEN** o campo `declineReason` é limpo (definido como `null`)

### Requirement: Exibir motivo para ministro, pastor e administrador
No painel de gestão da escala, o sistema SHALL exibir o motivo de recusa do voluntário ao lado do status "Não pode", visível apenas para usuários com papel de ministro, pastor ou administrador.

#### Scenario: Tooltip com motivo ao passar o mouse
- **WHEN** um ministro/pastor/adm visualiza o status "Não pode" de um voluntário que informou motivo
- **THEN** um ícone de informação é exibido ao lado do status e ao passar o mouse aparece o motivo em tooltip

#### Scenario: Status sem motivo não exibe ícone
- **WHEN** um ministro/pastor/adm visualiza o status "Não pode" de um voluntário sem motivo informado
- **THEN** apenas o status "Não pode" é exibido, sem ícone adicional

#### Scenario: Motivo não visível para voluntários comuns
- **WHEN** um voluntário sem papel de gestão visualiza a escala
- **THEN** o motivo de recusa de outros membros NÃO é exibido

### Requirement: Incluir motivo na notificação push
Quando o voluntário declina com motivo informado, o sistema SHALL incluir o motivo no corpo da notificação push enviada ao líder e administradores.

#### Scenario: Notificação com motivo
- **WHEN** um voluntário declina com motivo preenchido
- **THEN** a notificação push enviada ao líder/adm inclui o motivo no corpo da mensagem

#### Scenario: Notificação sem motivo
- **WHEN** um voluntário declina sem motivo
- **THEN** a notificação push mantém o texto padrão "marcou que nao pode ir"
