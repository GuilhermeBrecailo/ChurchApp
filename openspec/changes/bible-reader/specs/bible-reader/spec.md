## ADDED Requirements

### Requirement: Seleção de versão bíblica

O sistema SHALL permitir que o usuário selecione a versão bíblica entre as opções disponíveis: ACF, NVI, ARA, NTLH.

#### Scenario: Seleção de versão

- **WHEN** o usuário seleciona "NVI" no seletor de versão
- **THEN** os versículos carregados SHALL ser da versão NVI
- **THEN** a seleção SHALL ser salva em `localStorage` para persistir entre sessões

---

### Requirement: Navegação por livro e capítulo

O sistema SHALL permitir navegar por qualquer livro e capítulo da Bíblia via seletores em cascata.

#### Scenario: Navegar para capítulo específico

- **WHEN** o usuário seleciona "João" no seletor de livro e "3" no seletor de capítulo
- **THEN** os versículos de João 3 na versão selecionada SHALL ser exibidos com numeração

#### Scenario: Continuar de onde parou

- **WHEN** o usuário abre a página `/content/bible` com histórico no localStorage
- **THEN** o livro e capítulo anteriores SHALL ser carregados automaticamente

---

### Requirement: Exibição dos versículos com numeração

O sistema SHALL exibir os versículos com número antes do texto, em formato legível.

#### Scenario: Capítulo carregado

- **WHEN** um capítulo é carregado da API externa
- **THEN** cada versículo SHALL ser exibido como "[número] [texto]"

#### Scenario: Erro na API externa

- **WHEN** a API externa está indisponível
- **THEN** o sistema SHALL exibir mensagem de erro amigável "Não foi possível carregar os versículos agora"
