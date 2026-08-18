## Why

Líderes precisam compartilhar a escala do culto com a equipe no WhatsApp. Hoje precisam fazer print manual da tela — um botão que gera uma imagem limpa resolve isso sem depender de backend.

## What Changes

- Botão "Exportar" no detalhe de uma escala (visível apenas para o líder/pastor) que gera uma imagem PNG da escala com nome do culto, data, lista de músicas e lista de voluntários.
- Geração 100% no frontend via `html2canvas`.
- A imagem é baixada automaticamente ou exibe dialog de preview com botão de download.

## Capabilities

### New Capabilities

- `export-scale-image`: Exportação de escala como imagem PNG para compartilhamento.

### Modified Capabilities

<!-- Nenhuma spec existente com mudança de requisitos -->

## Impact

- **Backend**: Nenhum.
- **Frontend (web)**: Instalar `html2canvas`; componente `Scale/ExportCard.vue` com layout limpo para renderizar antes da captura; botão de exportar em `scale.vue` no detalhe da escala.
- **Banco de dados**: Sem migration.
