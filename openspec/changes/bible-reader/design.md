## Context

O app usa Nuxt 4 + Vuetify 4. A nova aba "Conteúdo" já existe (`pages/content/index.vue`). A API pública `bible-api.com` retorna versículos por referência (ex: `john+3:16`) e capítulos completos em múltiplas versões (ACF, NVI, ARA, KJV, etc.) sem autenticação. `$fetch` (Nuxt) é o padrão de chamada de API externa já usado no projeto via `customFetch.ts`.

## Goals / Non-Goals

**Goals:**
- Selecionar versão bíblica (ACF, NVI, ARA, NTLH)
- Navegar por livros e capítulos
- Ler versículos com numeração
- Continuar de onde parou (via localStorage)

**Non-Goals:**
- Busca por palavra-chave
- Marcação de versículos favoritos (v1)
- Modo offline com cache local dos capítulos
- Planos de leitura

## Decisions

### 1. API externa `bible-api.com`, sem backend próprio
A API é gratuita, sem autenticação, com boa cobertura de versões em português. Evita custo e complexidade de armazenar toda a Bíblia no PostgreSQL do app.

**Trade-off aceito**: Dependência de terceiro e indisponibilidade em caso de outage. Para v1, aceitável — não é funcionalidade crítica de missão.

**Alternativa descartada**: `API.Bible` (requer cadastro e key) — adiciona gerenciamento de secrets sem necessidade.

### 2. Persistência em `localStorage`, não no banco
Tom do leitor (posição, versão) é preferência de dispositivo, não de conta. Usar `localStorage` evita endpoint novo e migration desnecessários.

### 3. Versões disponíveis configuradas estaticamente no frontend
A lista de versões suportadas (`ACF`, `NVI`, `ARA`, `NTLH`) é hardcoded no composable. Não há admin de versões — o escopo é servir igrejas brasileiras com as versões mais populares.

### 4. Navegação por livro → capítulo, sem busca
Seletor cascata: `v-select` de livro → `v-select` de capítulo → conteúdo. Simples e alinhado com componentes Vuetify já usados no projeto.

## Risks / Trade-offs

- **Rate limit da API**: `bible-api.com` não documenta limites. Em caso de uso intenso, pode throttle. → Adicionar cache simples em memória (Nuxt `useState`) por sessão.
- **Nomes dos livros**: A API usa nomes em inglês. → Mapear para nomes em português no composable.

## Migration Plan

Sem migration. Sem backend. Apenas frontend novo em `pages/content/bible.vue` e composable `useBible.ts`.
