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
const stableFilterOverlaySources = [
  "app/components/Ministery/SongPickerDialog.vue",
  "app/components/Scale/SongPickerDialog.vue",
  "app/components/layouts/MoreOptionsOverlay.vue",
].map((relativePath) => ({
  relativePath,
  content: readFileSync(resolve(root, relativePath), "utf8"),
}));
const scaleSelectSources = [
  "app/components/Scale/FormDialog.vue",
  "app/components/Scale/AssignmentsDialog.vue",
].map((relativePath) => ({
  relativePath,
  content: readFileSync(resolve(root, relativePath), "utf8"),
}));
const scaleDetails = readFileSync(
  resolve(root, "app/components/Scale/DetailSheet.vue"),
  "utf8",
);
const pdfImportDialog = readFileSync(
  resolve(root, "app/components/Ministery/SongPdfImportDialog.vue"),
  "utf8",
);
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
  [
    "tema remove margens do fullscreen no mobile",
    /@media\s*\(max-width:\s*600px\)[\s\S]*?\.responsive-overlay--fullscreen\s+\.v-overlay__content\s*\{[\s\S]*?margin:\s*0;/,
    theme,
  ],
  [
    "ResponsiveOverlay calcula a altura mínima do sheet aberto",
    /ResizeObserver[\s\S]*responsive-overlay-min-height/,
    overlay,
  ],
  [
    "ResponsiveOverlay limpa a altura mínima ao fechar",
    /function handleAfterLeave[\s\S]*resetMobileSheetHeight[\s\S]*emit\("afterLeave"\)/,
    overlay,
  ],
  [
    "tema deixa bottom sheets dimensionarem pelo conteúdo",
    /v-bottom-sheet__content[\s\S]*height:\s*auto\s*!important/,
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
  ...stableFilterOverlaySources.map(({ relativePath, content }) => [
    `${relativePath} preserva altura durante filtros`,
    /height:\s*auto;/,
    content,
  ]),
  [
    "ScaleDetailSheet usa estrutura flexível e altura estável",
    /display:\s*flex;[\s\S]*?height:\s*min\(92svh,\s*920px\);/,
    scaleDetails,
  ],
  [
    "ScaleDetailSheet usa tokens de superfície",
    /background:\s*var\(--app-color-surface\)/,
    scaleDetails,
  ],
  ...scaleSelectSources.map(({ relativePath, content }) => [
    `${relativePath} configura menu de select fora do sheet`,
    /menu-props="scaleSelectMenuProps"/,
    content,
  ]),
  [
    "tema define camada para menus de select da escala",
    /scale-select-menu/,
    theme,
  ],
  [
    "importacao PDF oferece zona de upload acessivel",
    /pdf-import-upload-zone[\s\S]*role="button"[\s\S]*tabindex="0"/,
    pdfImportDialog,
  ],
  [
    "importacao PDF exibe o arquivo selecionado",
    /selectedFileName[\s\S]*pdf-import-file-card/,
    pdfImportDialog,
  ],
  [
    "importacao PDF anuncia progresso para tecnologias assistivas",
    /aria-live="polite"[\s\S]*isExtractingPdfSongs/,
    pdfImportDialog,
  ],
  [
    "importacao PDF possui rodape de acoes dedicado",
    /pdf-import-actions/,
    pdfImportDialog,
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
