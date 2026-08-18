## ADDED Requirements

### Requirement: Líder pode exportar escala como imagem
O sistema SHALL gerar e baixar uma imagem PNG da escala aberta quando o líder clicar em "Exportar", contendo título, data, lista de músicas e lista de voluntários com seus papéis.

#### Scenario: Exportar escala com músicas e voluntários
- **WHEN** o líder clica em "Exportar" no detalhe de uma escala
- **THEN** o sistema gera e baixa automaticamente um arquivo PNG com nome `escala-[titulo]-[data].png`

#### Scenario: Botão visível apenas para líderes
- **WHEN** um membro comum visualiza o detalhe da escala
- **THEN** o botão "Exportar" não é exibido

#### Scenario: Escala sem músicas
- **WHEN** a escala não tem músicas vinculadas
- **THEN** a imagem gerada exibe apenas título, data e voluntários, sem seção de músicas
