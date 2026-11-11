# Modo demonstração

O app inteiro roda no navegador, sem API, banco nem Keycloak. Toda chamada que
os composables fazem para `URL_BACKEND` é respondida por uma API falsa
(`demo/server.ts`) com dados de exemplo de uma igreja de verdade. O que você
cria ou muda fica salvo no aparelho (localStorage) até recomeçar a demo.

Serve para mostrar o app (e o redesign) no celular antes de ir para produção.

## Como rodar

```bash
cd web
npm run demo                 # nuxt dev em modo demo (http://localhost:3000)
npm run demo -- --port 3301  # outra porta
npm run build:demo           # site estático em .output/public
```

O `build:demo` gera um site estático (SPA, rotas com `#/`, caminhos
relativos). Dá para abrir a pasta `.output/public` em qualquer servidor
estático, inclusive numa subpasta (`https://exemplo.com/qualquer/caminho/`):

```bash
npx serve .output/public    # ou qualquer servidor de arquivos
```

Variáveis usadas: `NUXT_PUBLIC_DEMO=1` liga o modo demo (plugin
`app/plugins/demo.client.ts`); `DEMO_BUILD=1` muda o build para site estático.
Sem elas o build normal fica igual.

## Personas

Uma pílula no canto inferior esquerdo ("Demonstração · Ver como: Pastor ▾")
troca a pessoa logada. Trocar recarrega o app no Início.

| Persona | Quem é | O que mostra |
| --- | --- | --- |
| **Pastor** | Pr. Marcos | Igreja Batista Esperança (Curitiba-PR) configurada e cheia de dados |
| **Líder** | Ana Paula | Lidera o Louvor, com o cargo "Ministro" (escalas, músicas, ministério) |
| **Membro** | Lucas | Violão no Louvor, escalado no próximo domingo com resposta pendente |
| **Igreja nova** | Pr. Rafael | Igreja Vida Nova recém-criada: 1 membro, sem ministérios, horários ou escalas |
| **Sem igreja** | André | Acabou de se cadastrar, ainda não criou nem entrou numa igreja |
| **Aguardando aprovação** | Juliana | Pediu para entrar na Esperança; o pastor ainda não aprovou |

Pastor, Líder, Membro e "Aguardando aprovação" usam **a mesma igreja**: se o
pastor cria uma escala com o Lucas, o Lucas vê a escala e a notificação; se o
pastor aprova a Juliana, ela passa a ter acesso. "Igreja nova" e "Sem igreja"
têm dados separados.

**Recomeçar demonstração** (no mesmo menu) apaga tudo o que foi alterado e
volta aos dados de exemplo. As datas são relativas a hoje: escalas das
próximas 3 semanas e das 3 anteriores. Se a demo for reaberta dias depois, as
datas andam junto (em semanas inteiras, para domingo continuar domingo).

"Sair" funciona: o app volta para a tela de entrada, e qualquer e-mail/senha
entra de novo como a persona escolhida.

## Organização

```
demo/
  server.ts       roteador (método + caminho -> handler), envelope da API
  lib.ts          contexto da requisição, permissões, formatadores, erros
  store.ts        banco em memória + localStorage, persona atual, resetDemo()
  personas.ts     lista de personas
  types.ts        formato das "tabelas" (espelha o Prisma, simplificado)
  bible.ts        capítulos offline para a tela da Bíblia
  seed/           dados de exemplo (pessoas, músicas, conteúdo, igreja)
  handlers/       um arquivo por área (auth, church, departments, schedules,
                  occurrences, people, content, notifications, messages,
                  reports, billing, holyrics, admin) + index.ts que registra
```

Respostas seguem o `controllerHandler` da API:

- sucesso: HTTP 200 `{ data, status: 200 }`
- `throw new DemoError("mensagem")`: HTTP 200 `{ error, status: 409 }` (igual `DomainError`)
- `throw new DemoForbidden("mensagem")`: HTTP 403
- endpoint sem handler: HTTP 200 `{ data: [], status: 200 }` e um
  `console.warn("[demo] sem handler", método, caminho)` no console do navegador

## Como cobrir um endpoint novo

1. Veja o formato real da resposta no adapter da API
   (`api/src/interfaces/adapters/**`) e no tipo do composable que chama.
2. Abra (ou crie) o arquivo da área em `demo/handlers/` e registre a rota com o
   mesmo caminho da API (parâmetros com `:nome`):

   ```ts
   import { DemoError, defineHandlers, findOr, newId } from "../lib";

   export default defineHandlers((r) => {
     r.get("/api/church/eventos", (ctx) => {
       const church = ctx.requireChurch();          // erro 409 se não tiver igreja
       return ctx.db.extra.eventos ?? [];           // vira { data, status: 200 }
     });

     r.post("/api/church/eventos/:id/inscricao", (ctx) => {
       ctx.assertCan("CULT_EDIT", undefined, "Sem permissão"); // mesma regra da API
       const evento = findOr(lista, (e) => e.id === ctx.params.id, "Evento não encontrado");
       // ctx.body = JSON enviado; ctx.query = query string; ctx.user = quem está logado
       return { success: true };
     });
   });
   ```

3. Arquivo novo? Importe e acrescente em `AREAS` no `demo/handlers/index.ts`.
4. Dados novos: o jeito mais simples é guardar em `ctx.db.extra.<chave>` (não
   precisa mexer em tipos). Se for algo permanente, acrescente o campo em
   `types.ts`, em `seed/base.ts` (`emptyDb`) e popule em `seed/esperanca.ts`.
   Se mudar o formato do banco salvo, aumente `DB_VERSION` em `seed/base.ts`
   (quem já tinha a demo aberta recomeça com os dados novos).
5. Mutações (POST/PATCH/PUT/DELETE) são salvas sozinhas depois do handler —
   basta alterar `ctx.db`. Use ids que já existem no seed (`u-lucas`,
   `d-louvor`, `st-dom-manha`...) para manter tudo consistente entre telas.
6. Rode `npm test` (inclui `tests/demoServer.test.ts`) e abra a tela com
   `npm run demo`: o console não pode mostrar `[demo] sem handler`.

O que o contexto (`ctx`) oferece: `db`, `now`, `user`/`me()`, `church`/
`requireChurch()`, `membership`, `role`, `roles`, `isPrivileged`,
`can(permissão, ministérioId?)`, `assertCan(...)`, `params`, `query`, `body`,
`headers`, `persona`. Formatadores prontos em `lib.ts`: `scheduleView`,
`departmentView`, `mediaItemView`, `formatChurch`, `userRef`, `paginate`,
`uploadedFile` (arquivos enviados viram URL local).

## Limitações

- Push, WhatsApp, Holyrics, Cifra Club, importação de PDF e Mercado Pago são
  simulados (conectam/importam na hora com conteúdo de exemplo).
- Arquivos enviados ficam só no aparelho; PDFs grandes somem ao recarregar.
- A Bíblia offline tem Gênesis 1, Salmos 23 e João 3 (trecho), sempre no
  texto de Almeida (domínio público), qualquer que seja a versão escolhida; os
  outros capítulos mostram um aviso.
- Login, cadastro e "esqueci a senha" não validam nada.
