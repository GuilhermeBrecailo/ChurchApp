import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

const read = (relativePath) => readFileSync(resolve(root, relativePath), "utf8");
const pastoralDashboard = read("app/pages/pastoral/index.vue");
const pastoralPeople = read("app/pages/pastoral/pessoas.vue");
const navigation = read("app/utils/roleNavigation.ts");

const checks = [
  [
    "painel pastoral usa nome explícito de cuidado pastoral",
    /Cuidado pastoral/,
    pastoralDashboard,
  ],
  [
    "painel pastoral oferece ação primária clara para registrar visita",
    /Registrar visita/,
    pastoralDashboard,
  ],
  [
    "painel pastoral apresenta uma orientação inicial",
    /Comece por aqui/,
    pastoralDashboard,
  ],
  [
    "painel pastoral transforma pedidos de oração em ação",
    /dashboard\.pendingPrayers\.slice[\s\S]*Revisar pedidos de oração/,
    pastoralDashboard,
  ],
  [
    "painel pastoral mantém cards de resumo clicáveis",
    /summary-action-card[\s\S]*NuxtLink/,
    pastoralDashboard,
  ],
  [
    "lista pastoral evita abreviação de ausência",
    /missedOccurrences[\s\S]*ausência/,
    pastoralPeople,
  ],
  // O cartão pastoral do Início saiu (os alertas viraram itens de "Para
  // você"); a área aparece como "Cuidado" dentro de Gestão.
  [
    "navegação identifica a área como cuidado pastoral",
    /key: "care"[\s\S]*title: "Cuidado pastoral"/,
    navigation,
  ],
];

const failures = checks
  .filter(([, pattern, content]) => !pattern.test(content))
  .map(([label]) => label);

if (failures.length > 0) {
  console.error("Pastoral UX contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Pastoral UX contract passed (${checks.length} checks).`);
}
