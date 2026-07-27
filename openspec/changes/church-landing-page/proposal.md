## Why

Hoje o AppChurch só existe "para dentro": não há nenhuma página pública para visitantes conhecerem a igreja, ver os próximos cultos ou ler uma palavra do pastor antes de decidir visitar. Cada igreja cadastrada precisa de uma vitrine pública, com a própria identidade visual, que sirva tanto para atrair visitantes quanto para ser compartilhada em redes sociais e WhatsApp.

## What Changes

- Nova página pública `/c/:slug` (sem autenticação) por igreja, com logo, cor de destaque, próximos cultos (semana/mês) e um feed com avisos, palavras e orações publicadas pelo pastor.
- Cada igreja ganha um `slug` único e editável pelo pastor (rota própria, ex: `appchurch.com/c/comunidade-vida`), além de cor de destaque opcional para personalizar a landing.
- Pastor cadastra horários recorrentes de culto (dia da semana + horário + rótulo) em `/admin`, exibidos tanto na landing pública quanto no dashboard interno.
- Fluxo de publicação simplificado em `/admin`: pastor (ou quem tiver a permissão) marca um aviso como "público" e escolhe o tipo (Aviso, Palavra do Pastor, Oração) para aparecer na landing, reaproveitando o modelo de `Announcement` já existente.
- Ao abrir a landing pública pela primeira vez, o visitante recebe um prompt para ativar notificações push, reaproveitando a infraestrutura de push já existente no projeto.
- Pastor/líder pode designar, por ministério, outras pessoas além do líder titular com permissão para alterar a escala e o repertório de músicas daquele ministério específico (hoje só pastor e o único `leaderId` podem editar).

## Capabilities

### New Capabilities

- `church-landing-page`: Página pública por igreja (`/c/:slug`) com identidade visual própria, calendário de próximos cultos e feed de conteúdo público; inclui prompt de ativação de notificações push no primeiro acesso.
- `landing-content-publishing`: Cadastro de horários de culto recorrentes e publicação simplificada (no admin) de avisos, palavras e orações do pastor marcados como públicos para a landing.
- `ministry-schedule-delegation`: Pastor ou líder titular de um ministério pode designar outros membros como gestores daquele ministério, com permissão para editar escala e repertório de músicas apenas dele.

### Modified Capabilities

<!-- Nenhuma spec arquivada existente com mudança de requisitos -->

## Impact

- **Backend**: Campos `slug` (único) e `accentColor` (opcional) em `Crunch`; novo model `ServiceTime` (horários recorrentes de culto); campos `isPublic` e `kind` (`ANNOUNCEMENT` | `PASTOR_MESSAGE` | `PRAYER`) em `Announcement`; novo model `DepartmentManager` (ou campo `canManageSchedule` em `UserDepartmentMembership`) para delegação por ministério; novas rotas públicas `GET /api/public/church/:slug` e `GET /api/public/church/:slug/service-times`; migrations correspondentes.
- **Frontend (web)**: Nova página pública `web/app/pages/c/[slug].vue` (fora do middleware de autenticação) com layout próprio, responsivo e sem navegação interna; componentes de identidade da igreja, calendário de cultos e feed público; seção de horários e toggle "público" no formulário de avisos em `pages/admin.vue`; UI de gestão de gestores por ministério na tela de ministério; prompt de notificação reaproveitando `usePushNotifications.ts`.
- **Banco de dados**: Migrations para `slug`/`accentColor` em `Crunch`, novo model `ServiceTime`, novos campos em `Announcement`, novo relacionamento de gestores por `Department`.
