import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Contrato de UX de Pessoas e do cuidado pastoral (redesign: /pessoas,
// /pessoas/[id], /pessoas/cuidado, /pessoas/cargos). Confere que as decisões
// de produto continuam no código: uma fila com data e uma ação por item,
// autorização de contato (LGPD), confirmação nas ações destrutivas e o
// "Adicionar pessoa" num fluxo só.

const root = resolve(import.meta.dirname, "..");

const read = (relativePath) => readFileSync(resolve(root, relativePath), "utf8");
const readIfExists = (relativePath) =>
  existsSync(resolve(root, relativePath)) ? read(relativePath) : null;

const directory = read("app/pages/pessoas/index.vue");
const profile = read("app/pages/pessoas/[id].vue");
const care = read("app/pages/pessoas/cuidado.vue");
const roles = read("app/pages/pessoas/cargos.vue");
const careQueue = read("app/utils/careQueue.ts");
const segments = read("app/utils/peopleSegments.ts");
const consent = read("app/utils/contactConsent.ts");
const contactActions = read("app/components/People/ContactActions.vue");
const addPerson = read("app/components/People/AddPersonSheet.vue");
const grantRole = read("app/components/People/GrantRoleSheet.vue");
const statusActions = read("app/components/People/StatusActions.vue");
const editSheet = read("app/components/People/PersonEditSheet.vue");
const roleEditor = read("app/components/People/RoleEditorSheet.vue");
const nuxtConfig = read("nuxt.config.ts");
const pastoralOverview = readIfExists("app/components/Dashboard/PastoralOverviewCard/index.vue");

const removedPages = [
  "app/pages/admin/pessoas.vue",
  "app/pages/pastoral/index.vue",
  "app/pages/pastoral/pessoas.vue",
  "app/pages/pastoral/visitas.vue",
  "app/pages/pastoral/visitantes.vue",
  "app/components/Admin/PessoasRoster.vue",
];

const checks = [
  ["fila de cuidado usa nome explícito", /title="Cuidado"/, care],
  ["fila de cuidado oferece ação primária para agendar visita", /Agendar visita/, care],
  [
    "fila de cuidado tem uma ação por item (registrar contato, concluir ou agendar visita)",
    /"concluir-visita": "Concluir visita"[\s\S]*"agendar-visita": "Agendar visita"[\s\S]*"registrar-contato": "Registrar contato"/,
    careQueue,
  ],
  ["fila de cuidado é agrupada por data", /atrasado: "Atrasados"[\s\S]*hoje: "Hoje"/, careQueue],
  ["fila de cuidado transforma pedidos de oração em ação", /pendingPrayers[\s\S]*to="\/prayer"/, care],
  ["fila de cuidado evita abreviação de ausência", /Faltando aos cultos/, careQueue],
  ["diretório sincroniza os filtros com ?filtro=", /filtro:\s*value/, directory],
  ["diretório mostra a linha em palavras simples", /personStatusLine\(person\)/, directory],
  ["diretório pede confirmação antes de recusar pedido", /UtilsConfirmDialog[\s\S]*Recusar pedido/, directory],
  ["diretório só mostra Adicionar pessoa a quem pode cadastrar", /v-if="canAdd"[\s\S]*Adicionar pessoa/, directory],
  ["quem só faz cuidado abre em Em cuidado", /if \(access\.canCare\) return "cuidado"/, segments],
  ["WhatsApp e e-mail respeitam a autorização de contato", /contactOptions\(props\.person\)/, contactActions],
  ["regra de autorização bloqueia visitante sem consentimento", /followUp\) return person\.followUp\.consentToContact === true/, consent],
  ["perfil oferece Registrar autorização", /Registrar autorização/, contactActions],
  ["perfil tem zona de perigo com confirmação", /Zona de perigo[\s\S]*UtilsConfirmDialog/, profile],
  ["perfil abre o perfil de quem veio do Início", /usePeople/, profile],
  ["desligar pede confirmação", /title="Desligar da igreja\?"/, statusActions],
  ["adicionar pessoa pergunta sobre o acesso ao app", /Acesso ao app\?[\s\S]*Agora não[\s\S]*Enviar convite/, addPerson],
  ["convite é a opção recomendada", /value: "convite"[\s\S]*recommended: true/, addPerson],
  ["dar cargo mostra os modelos prontos com resumo", /ROLE_PRESET_SUMMARIES/, grantRole],
  ["dar cargo mostra erros dentro da folha", /v-alert v-if="error"/, grantRole],
  ["editar dados não rebaixa admin", /Admin <span>· definido pela plataforma/, editSheet],
  ["editar dados só manda o tipo quando mudou", /roleChanged \? \{ role: form\.role \}/, editSheet],
  ["editor de cargo tem ícone para pedidos de oração", /prayer: Sparkles/, roleEditor],
  ["criar cargo próprio continua no plano Pro", /PlanLock feature="CUSTOM_ROLES"/, roles],
  ["rotas antigas redirecionam para Pessoas", /"\/pastoral":\s*\{ redirect: "\/pessoas\/cuidado" \}/, nuxtConfig],
  ...removedPages.map((relativePath) => [
    `${relativePath} foi removido`,
    !existsSync(resolve(root, relativePath)),
    true,
  ]),
  ...(pastoralOverview
    ? [
        ["card da home identifica acompanhamento pastoral", /Acompanhamento pastoral/, pastoralOverview],
        ["card da home abre direto o perfil da pessoa", /`\/pessoas\/\$\{member\.id\}`/, pastoralOverview],
      ]
    : []),
];

const failures = checks
  .filter(([, pattern, content]) =>
    typeof pattern === "boolean" ? pattern === false : !pattern.test(content),
  )
  .map(([label]) => label);

if (failures.length > 0) {
  console.error("Pastoral UX contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Pastoral UX contract passed (${checks.length} checks).`);
}
