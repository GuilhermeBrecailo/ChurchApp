## 1. Dependência

- [ ] 1.1 Instalar `html2canvas` em `web/`: `npm install html2canvas`
- [ ] 1.2 Adicionar tipos `@types/html2canvas` se necessário

## 2. Frontend — Componente de Exportação

- [ ] 2.1 Criar `web/app/components/Scale/ExportCard.vue` com layout fixo (sem Vuetify), fontes system-ui, fundo branco, exibindo: nome do culto, data formatada, lista de músicas (título + tom) e lista de voluntários (nome + papel)
- [ ] 2.2 Componente renderizado off-screen (`position: absolute; left: -9999px; top: -9999px`) quando `exportVisible` é true

## 3. Frontend — Lógica de Exportação em scale.vue

- [ ] 3.1 Criar composable ou função `useExportScale` em `scale.vue` que: monta `ExportCard` com os dados da escala, chama `html2canvas(element, { scale: 2 })`, cria link de download e dispara o clique
- [ ] 3.2 Adicionar botão "Exportar" (com ícone `Download` do Lucide) no header do detalhe da escala, condicional a `selectedDetailEvent.canManage`
- [ ] 3.3 Mostrar loading enquanto a imagem é gerada (`isExporting` ref)
- [ ] 3.4 Nomear arquivo como `escala-[slug-do-titulo]-[data-iso].png`
