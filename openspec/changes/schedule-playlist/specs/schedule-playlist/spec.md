## ADDED Requirements

### Requirement: Playlist visível no detalhe da escala

O sistema SHALL exibir as músicas vinculadas a uma escala dentro do dialog de detalhe da escala, acessível ao voluntário que está naquela escala.

#### Scenario: Escala com músicas vinculadas

- **WHEN** o voluntário abre o detalhe de uma escala que tem músicas (`ScheduleMediaItem`)
- **THEN** a seção/aba "Playlist" SHALL exibir as músicas com título e tom original

#### Scenario: Escala sem músicas

- **WHEN** o voluntário abre o detalhe de uma escala sem músicas vinculadas
- **THEN** a aba "Playlist" SHALL exibir empty state "Nenhuma música adicionada"

---

### Requirement: Tom pessoal do voluntário exibido

O sistema SHALL exibir o tom pessoal do usuário (`UserSongPreference.personalKey`) ao lado do tom original da música quando o usuário tiver preferência salva.

#### Scenario: Usuário com tom pessoal salvo

- **WHEN** o voluntário visualiza a playlist e tem `personalKey` salvo para uma música
- **THEN** a música SHALL exibir "Tom: [original] → Seu tom: [personalKey]"

#### Scenario: Usuário sem tom pessoal

- **WHEN** o voluntário não tem preferência salva para a música
- **THEN** apenas o tom original é exibido

---

### Requirement: Letra/cifra expandível por música

O sistema SHALL permitir expandir cada música na playlist para visualizar letra e cifra.

#### Scenario: Expandir música

- **WHEN** o voluntário clica em uma música na playlist
- **THEN** `SongTextRenderer` SHALL exibir a letra/cifra disponível no `MediaItem.url`
