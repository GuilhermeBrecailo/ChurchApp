## ADDED Requirements

### Requirement: Músico visualiza sua playlist pessoal

O sistema SHALL exibir em `/content/playlist` todas as músicas para as quais o usuário tem `UserSongPreference` salva, com tom pessoal e título.

#### Scenario: Lista de músicas com preferência salva

- **WHEN** o músico acessa `/content/playlist`
- **THEN** a página SHALL exibir cards de cada música com `title` e `personalKey` (se salvo)

#### Scenario: Nenhuma preferência salva

- **WHEN** o músico não tem nenhuma `UserSongPreference`
- **THEN** a página SHALL exibir empty state com link para os ministérios onde pode salvar preferências

---

### Requirement: Visualização de letra/cifra no tom pessoal

O sistema SHALL permitir expandir cada música para visualizar letra e cifra, usando `SongTextRenderer` no tom pessoal do músico.

#### Scenario: Expandir música com tom pessoal

- **WHEN** o músico clica em uma música que tem `personalKey` salvo
- **THEN** `SongTextRenderer` SHALL renderizar a cifra transposta para o `personalKey` do usuário

---

### Requirement: Edição do tom pessoal inline

O sistema SHALL permitir que o músico altere seu `personalKey` diretamente na playlist pessoal.

#### Scenario: Alterar tom pessoal

- **WHEN** o músico seleciona um novo tom no dropdown da música
- **THEN** o sistema SHALL chamar `PATCH /api/church/my-song-preferences/:mediaItemId` e atualizar o tom imediatamente na UI
