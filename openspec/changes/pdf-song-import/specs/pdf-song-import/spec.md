## ADDED Requirements

### Requirement: Importar músicas de um PDF
O sistema SHALL aceitar o upload de um PDF de repertório, extrair o texto, separar em músicas (título + letra) e apresentar as músicas detectadas para revisão antes de criar.

#### Scenario: PDF com várias músicas
- **WHEN** um usuário autorizado sobe um PDF com 3 músicas
- **THEN** o sistema apresenta 3 músicas detectadas, cada uma com título e letra, para revisão

#### Scenario: Revisar antes de criar
- **WHEN** o usuário ajusta o título de uma música detectada e confirma
- **THEN** as músicas são criadas no ministério com os dados revisados e entram na playlist

#### Scenario: PDF sem texto extraível
- **WHEN** o PDF é uma imagem escaneada sem texto
- **THEN** o sistema avisa que não foi possível extrair o texto e não cria músicas em branco

### Requirement: Autorização da importação
A importação SHALL exigir a mesma permissão de gerenciar músicas do ministério (pastor/admin, líder, ou cargo com permissão de música do ministério).

#### Scenario: Sem permissão de música
- **WHEN** um membro sem permissão de música tenta importar um PDF
- **THEN** o sistema rejeita a ação
