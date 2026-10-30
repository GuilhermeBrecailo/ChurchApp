# Configuração inicial da igreja Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Separar o cadastro de pastor e membro e permitir que o pastor crie a igreja com ministérios e módulos iniciais, ou pule a configuração.

**Architecture:** A tela pública de cadastro seleciona o papel e encaminha o pastor para criar a igreja; o membro usa o cadastro por convite já existente. Reutilizar um componente de configuração nas duas telas de criação da igreja. Enviar a configuração opcional no payload existente e criar os ministérios e vínculos na mesma transação Prisma que cria a igreja.

**Tech Stack:** Nuxt 4, Vue 3, Vuetify, TypeScript, Fastify, Prisma.

**Spec:** `docs/superpowers/specs/2026-10-30-configuracao-inicial-igreja.md`

## Global Constraints

- Não alterar o mecanismo de autenticação; reutilizar os endpoints existentes.
- Não adicionar dependências ou migrações de banco.
- Preservar compatibilidade com chamadas atuais da API.
- Deixar a opção de configuração inicial como opcional.

## Review Focus

- Payload ausente deve continuar criando igreja como hoje — validado pela compatibilidade de tipos e pelo fluxo existente.
- Nomes de ministérios duplicados ou inválidos devem ser rejeitados — validar no backend.
- Tipos desconhecidos devem ser rejeitados — validar no backend.
- Configurar depois não deve gravar ministérios — revisar a transação.
- Falha ao gravar departamentos deve reverter a criação inteira — manter as operações na mesma transação.

---

### Task 1: Persistir configuração inicial junto com a igreja

**Files:**
- Modify: `api/src/interfaces/adapters/userAdapters.ts`
- Modify: `web/composables/useChurch.ts`

- [x] Adicionar ao contrato opcional de criação o modo de configuração e a lista de ministérios (nome e tipo).
- [x] Validar tamanho, tipos permitidos e nomes duplicados no backend.
- [x] Criar ministérios com módulos por tipo e vínculo do pastor na transação de criação da igreja.
- [x] Manter os campos opcionais para não quebrar chamadas existentes.

### Task 2: Adicionar configuração reutilizável ao onboarding

**Files:**
- Create: `web/composables/churchOnboarding.ts`
- Create: `web/app/components/onboarding/ChurchMinistrySetup.vue`
- Modify: `web/app/pages/index.vue`
- Modify: `web/app/pages/onboarding/church.vue`

- [x] Definir sugestões e módulos iniciais por tipo.
- [x] Implementar escolha “Configurar agora/depois”, seleção editável e inclusão de ministério personalizado.
- [x] Incluir o mesmo componente nas duas telas de criação da igreja.
- [x] Enviar a seleção para a API e preservar o fluxo atual de sucesso/erro.

### Task 3: Separar os cadastros por perfil

**Files:**
- Modify: `web/app/pages/register.vue`

- [x] Mostrar seleção explícita de Pastor/Membro no cadastro.
- [x] Manter o cadastro de pastor e levar o membro ao cadastro por convite e aprovação.
- [x] Exibir confirmação do pedido do membro e manter o acesso ao login.

### Task 4: Verificar a entrega

- [x] Revisar diff e compatibilidade da configuração opcional.
- [x] Executar build da aplicação web e verificação de tipos da API, sem instalar dependências.
