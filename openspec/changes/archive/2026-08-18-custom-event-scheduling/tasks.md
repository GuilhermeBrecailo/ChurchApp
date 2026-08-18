## 1. Backend — Schema e Migration

- [ ] 1.1 Adicionar campo `eventType String @default("CULTO")` ao model `Schedule` no schema Prisma
- [ ] 1.2 Aplicar migration com `prisma migrate dev`

## 2. Backend — Endpoints

- [ ] 2.1 Adicionar `eventType` ao `scheduleSelect` em `churchDepartmentAdapters.ts` para retornar o campo nas listagens e detalhes
- [ ] 2.2 Atualizar `createChurchSchedule` para aceitar e salvar `body.eventType` (default "CULTO" se não informado)
- [ ] 2.3 Atualizar `updateChurchSchedule` para aceitar e salvar `body.eventType`

## 3. Frontend — Formulário de Criação/Edição

- [ ] 3.1 Adicionar `eventType` ao `scheduleForm` em `scale.vue` com valor padrão "CULTO"
- [ ] 3.2 Adicionar `v-select` com opções Culto / Reunião / Retiro / Ensaio Geral / Outro no form de criação/edição de escala
- [ ] 3.3 Exibir `v-text-field` "Nome do evento" quando "Outro" é selecionado; compor valor final como `OUTRO:<texto>` antes de enviar
- [ ] 3.4 Preencher `eventType` corretamente ao abrir o form de edição (parse do prefixo `OUTRO:`)

## 4. Frontend — Exibição

- [ ] 4.1 Adicionar `eventType` ao tipo `ScheduleEvent` e ao mapeamento em `toScheduleEvent`
- [ ] 4.2 Criar helper `formatEventType(eventType: string): string` que converte `"OUTRO:Reunião de Líderes"` → `"Reunião de Líderes"` e `"CULTO"` → `"Culto"`
- [ ] 4.3 Exibir tipo como `v-chip` small no card da escala (`Scale/ScheduleCard.vue` ou equivalente)
- [ ] 4.4 Exibir tipo no cabeçalho do detalhe da escala em `scale.vue`

## 5. Frontend — Filtro por Tipo

- [ ] 5.1 Extrair tipos únicos das escalas carregadas para montar opções de filtro
- [ ] 5.2 Adicionar filtro por tipo na `filter-strip` da página de escalas, integrado ao filtro de ministério já existente
