# Fluxo do ChurchApp

Diagrama geral de navegação e funcionalidades da plataforma.

```mermaid
flowchart TD
    START([Usuário acessa o app]) --> AUTH{Autenticado?}

    AUTH -- Não --> LOGIN[/login\nEntrar com e-mail + senha/]
    AUTH -- Sim --> CHURCH{Tem igreja?}

    LOGIN --> REGISTER[/register\nCriar conta/]
    LOGIN --> FORGOT[/forgot-password\nRecuperar senha/]
    LOGIN --> CHURCH

    REGISTER --> CHURCH

    CHURCH -- Não --> ONBOARD[/onboarding\nConfigure sua conta/]
    ONBOARD --> CREATE_CHURCH[Criar nova igreja\nNome + dados da Crunch]
    ONBOARD --> JOIN_CHURCH[/join\nEntrar via código de convite/]
    CREATE_CHURCH --> HOME
    JOIN_CHURCH --> HOME

    CHURCH -- Sim --> HOME

    HOME[/index.vue\nInício/]
    HOME --> NEXT_SCALE[Card: Próxima Escala\nMinistério + data + músicas]
    HOME --> DAILY_VERSE[Card: Versículo do Dia\nExibição e compartilhamento]
    HOME --> DEVOTIONAL_CARD[Card: Devocional\nLeitura rápida]
    HOME --> ANNOUNCEMENTS_CARD[Card: Avisos\nÚltimos avisos da igreja]

    %% Bottom Navigation
    HOME --- NAV{{Navegação inferior}}
    NAV --> CONTENT
    NAV --> MINISTERY
    NAV --> USER
    NAV --> ADMIN

    %% Notificações via AppBar
    HOME --- APPBAR{{AppBar — sino 🔔}}
    APPBAR --> NOTIF_DROPDOWN[Dropdown: lista de notificações\nBadge com não lidas\nMarcar todas como lidas]
    NOTIF_DROPDOWN --> NOTIF_PAGE[/notifications\nInbox completo\nDatas relativas · click marca lida]

    %% Conteúdo
    CONTENT[/content\nConteúdo/]
    CONTENT --> BIBLE[/content/bible\nBíblia\nBusca por versículo · Versões PT\nNVI · ARC · NVT · etc/]
    CONTENT --> DEVOTIONALS[/content/devotionals\nDevocional\nLista de devocionais da igreja/]
    CONTENT --> ANNOUNCEMENTS[/content/announcements\nAvisos\nPastor publica · membros leem/]
    CONTENT --> PRAYER[/prayer\nPedidos de Oração\nPostar · interceder · marcar respondido/]

    %% Ministérios
    MINISTERY[/ministery\nMinistérios/]
    MINISTERY --> MIN_DETAIL[/ministery/:id\nDetalhe do Ministério\nEscalas + membros/]
    MIN_DETAIL --> SCALE[/scale\nEscalas\nLista filtrada por ministério/]

    SCALE --> SCALE_DETAIL{Detalhe da Escala}
    SCALE_DETAIL --> SCHEDULE_INFO[Cabeçalho\nData · Ensaio · Notas]
    SCALE_DETAIL --> SONGS[Lista de Músicas\nOrdem ▲▼ · Scroll vertical]
    SCALE_DETAIL --> ASSIGNMENTS[Atribuições\nFunção de cada membro]

    SONGS --> SONG_DETAIL[Cifra da música\nLetra com acordes]
    SONG_DETAIL --> CHORD_MODE{Modo de cifra}
    CHORD_MODE --> AUTO[Auto\nDetecta instrumento do membro]
    CHORD_MODE --> GUITAR[Cordas]
    CHORD_MODE --> KEYBOARD[Teclado]

    SCALE_DETAIL --> CREATE_SCALE[Criar/Editar Escala\nData · Ensaio · Músicas · Tipo de evento]

    %% Usuário
    USER[/user\nPerfil do Usuário\nDados · instrumento · notificações push/]

    %% Admin
    ADMIN[/admin\nPainel Admin\nRelatórios · Departamentos · Push/]
    ADMIN --> SETTINGS[/settings\nConfigurações\nTema claro/escuro/]

    %% Estilos
    classDef page fill:#eef2ff,stroke:#6366f1,color:#1e1b4b
    classDef action fill:#f0fdf4,stroke:#22c55e,color:#14532d
    classDef decision fill:#fffbeb,stroke:#f59e0b,color:#78350f
    classDef nav fill:#fdf4ff,stroke:#a855f7,color:#581c87

    class HOME,LOGIN,REGISTER,FORGOT,ONBOARD,JOIN_CHURCH,CONTENT,BIBLE,DEVOTIONALS,ANNOUNCEMENTS,PRAYER,MINISTERY,MIN_DETAIL,SCALE,USER,ADMIN,SETTINGS,NOTIF_PAGE page
    class CREATE_CHURCH,NEXT_SCALE,DAILY_VERSE,DEVOTIONAL_CARD,ANNOUNCEMENTS_CARD,SCHEDULE_INFO,SONGS,ASSIGNMENTS,SONG_DETAIL,AUTO,GUITAR,KEYBOARD,NOTIF_DROPDOWN,CREATE_SCALE action
    class AUTH,CHURCH,SCALE_DETAIL,CHORD_MODE decision
    class NAV,APPBAR nav
```

## Resumo por perfil

### Membro comum
- Acessa escalas do seu ministério e vê suas atribuições
- Lê cifra na tonalidade do seu instrumento
- Lê devocional, versículo, avisos e pedidos de oração
- Recebe notificações push de escala e alterações
- Envia pedidos de oração

### Líder de ministério
- Cria e edita escalas (data, músicas, atribuições, tipo de evento)
- Reordena músicas da escala com ▲▼
- Adiciona notas de ensaio

### Pastor / Admin
- Publica avisos, devocionais e versículo do dia
- Visualiza relatórios no painel admin
- Gerencia departamentos e convites
- Envia notificações push para toda a igreja
```
