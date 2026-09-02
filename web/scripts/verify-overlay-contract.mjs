import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const overlay = readFileSync(
  resolve(root, "app/components/utils/ResponsiveOverlay.vue"),
  "utf8",
);
const theme = readFileSync(resolve(root, "app/assets/css/theme.css"), "utf8");

const directDialogMigrations = [
  "app/components/utils/ConfirmDialog.vue",
  "app/components/Admin/ChurchPlanDialog.vue",
  "app/components/Scale/DeclineDialog.vue",
  "app/pages/plans.vue",
  "app/pages/prayer.vue",
].map((relativePath) => ({
  relativePath,
  content: readFileSync(resolve(root, relativePath), "utf8"),
}));

const legacyDialogMigrations = [
  "app/components/Ministery/DetailsView/index.vue",
  "app/components/Ministery/NewMusicModal.vue",
  "app/components/Ministery/NewReferenceModal.vue",
  "app/pages/cultos/index.vue",
  "app/pages/cultos/[id].vue",
  "app/pages/pastoral/visitas.vue",
].map((relativePath) => ({
  relativePath,
  content: readFileSync(resolve(root, relativePath), "utf8"),
}));

const longFormOverlays = [
  "app/components/Ministery/ActivityFormDialog.vue",
  "app/components/Ministery/AssignmentsDialog.vue",
  "app/components/Ministery/ResourceFormDialog.vue",
  "app/components/Ministery/ScheduleFormDialog.vue",
  "app/components/Ministery/SongFormDialog.vue",
  "app/components/Ministery/TaskFormDialog.vue",
  "app/components/Scale/AssignmentsDialog.vue",
  "app/components/Scale/FormDialog.vue",
  "app/pages/admin/configuracoes.vue",
  "app/pages/admin/mensagens.vue",
  "app/pages/admin/ministerios.vue",
  "app/pages/admin/pessoas.vue",
  "app/pages/admin/relatorios.vue",
  "app/pages/ministery/index.vue",
  "app/pages/user.vue",
].map((relativePath) => ({
  relativePath,
  content: readFileSync(resolve(root, relativePath), "utf8"),
}));

const moreOptionsSources = [
  "app/components/layouts/bottomNavigation/index.vue",
  "app/components/Dashboard/quickAccess/index.vue",
].map((relativePath) => ({
  relativePath,
  content: readFileSync(resolve(root, relativePath), "utf8"),
}));
const moreOptionsComponentPath = resolve(root, "app/components/layouts/MoreOptionsOverlay.vue");
const moreOptionsComponent = existsSync(moreOptionsComponentPath)
  ? readFileSync(moreOptionsComponentPath, "utf8")
  : "";
const onboarding = readFileSync(resolve(root, "app/components/OnboardingModal/index.vue"), "utf8");

const checks = [
  [
    "ResponsiveOverlay declara variantes semânticas",
    /type OverlayVariant = "base"\s*\|\s*"form"\s*\|\s*"confirm"\s*\|\s*"detail"\s*\|\s*"fullscreen"[\s\S]*?variant\?:\s*OverlayVariant/,
    overlay,
  ],
  [
    "ResponsiveOverlay aplica a classe base",
    /responsive-overlay/,
    overlay,
  ],
  [
    "tema define raio próprio para overlays",
    /--app-overlay-radius:/,
    theme,
  ],
  [
    "tema define estilo para conteúdo rolável",
    /responsive-overlay--scrollable/,
    theme,
  ],
  ...directDialogMigrations.flatMap(({ relativePath, content }) => [
    [
      `${relativePath} usa ResponsiveOverlay`,
      /UtilsResponsiveOverlay/,
      content,
    ],
    [
      `${relativePath} não usa v-dialog direto`,
      !/<v-dialog\b/.test(content),
      true,
    ],
  ]),
  ...legacyDialogMigrations.flatMap(({ relativePath, content }) => [
    [
      `${relativePath} usa ResponsiveOverlay`,
      /UtilsResponsiveOverlay/,
      content,
    ],
    [
      `${relativePath} não usa v-dialog direto`,
      !/<v-dialog\b/.test(content),
      true,
    ],
  ]),
  ...longFormOverlays.map(({ relativePath, content }) => [
    `${relativePath} habilita scroll no overlay`,
    /\bscrollable\b/,
    content,
  ]),
  [
    "MoreOptionsOverlay existe como componente compartilhado",
    /UtilsResponsiveOverlay/,
    moreOptionsComponent,
  ],
  ...moreOptionsSources.map(({ relativePath, content }) => [
    `${relativePath} usa MoreOptionsOverlay`,
    /MoreOptionsOverlay/,
    content,
  ]),
  [
    "onboarding usa dots acionáveis",
    /<button[\s\S]*class="onboarding-dot"[\s\S]*aria-label=/,
    onboarding,
  ],
  [
    "onboarding respeita reduced motion",
    /prefers-reduced-motion:\s*reduce/,
    onboarding,
  ],
];

const failures = checks
  .filter(([, pattern, content]) =>
    typeof pattern === "boolean" ? pattern === false : !pattern.test(content),
  )
  .map(([label]) => label);

if (failures.length > 0) {
  console.error("Overlay contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Overlay contract passed (${checks.length} checks).`);
}
