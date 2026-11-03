# Convite para instalar o ChurchApp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar um convite de instalação global para quem usa o ChurchApp em um navegador Android ou iOS e ainda não instalou o PWA.

**Architecture:** Um composable client-side detecta a plataforma, instalação e eventos do navegador, além de controlar a espera de sete dias após dispensar. Um componente global, montado como irmão do `NuxtLayout`, mostra um banner responsivo e um diálogo nativo acessível; no Android usa `beforeinstallprompt` quando disponível e, no iOS, apresenta instruções manuais.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Vuetify e CSS scoped existente.

**Spec:** `docs/superpowers/specs/2026-11-03-pwa-install-prompt-design.md`

## Global Constraints

- Preservar os fluxos atuais de notificações push.
- Não adicionar dependências nem chamadas à API.
- Não mostrar o convite em desktop ou em modo standalone.
- Esperar sete dias após a pessoa dispensar o aviso.
- Respeitar a confirmação manual exigida pelo iOS para adicionar à Tela de Início.
- Não adicionar nem executar testes automatizados.

## Review Focus

- Android com `beforeinstallprompt`: CTA abre o diálogo nativo; instalação concluída oculta o banner.
- Android sem o evento de instalação: CTA oferece instruções pelo menu do navegador.
- iOS Safari: CTA explica Compartilhar → Adicionar à Tela de Início → Adicionar.
- PWA aberto em `standalone`: o convite não aparece.
- Convite dispensado: não aparece durante sete dias no mesmo navegador.

---

### Task 1: Criar e montar o convite global

**Files:**
- Create: `web/composables/usePwaInstallPrompt.ts`
- Create: `web/app/components/PwaInstallPrompt.vue`
- Modify: `web/app/app.vue`

**Interfaces:**
- `usePwaInstallPrompt()` fornece estado de visibilidade, plataforma, disponibilidade do convite nativo, abertura de instruções e ações de instalar/dispensar.
- `PwaInstallPrompt.vue` consome o composable e apresenta os passos adequados à plataforma.

- [x] **Step 1: Implementar o composable client-side** para detectar iOS/Android e modo instalado, guardar o evento `beforeinstallprompt`, reagir a `appinstalled` e persistir o horário de dispensa por sete dias.
- [x] **Step 2: Criar o banner e as instruções acessíveis** com os tokens e padrões de interação do app; usar o prompt nativo no Android quando disponível e instruções manuais como fallback.
- [x] **Step 3: Montar o componente como irmão do `NuxtLayout` em `web/app/app.vue`**, dentro de `ClientOnly`, para cobrir todas as rotas sem depender do slot do layout ou de Vuetify.
- [x] **Step 4: Rodar `npm run build` na pasta `web` e validar manualmente** a resposta Android, iOS, standalone e dispensa no navegador; confirmar que o fluxo de push permanece independente.
