import {
  normalizeThemeMode,
  resolveThemeMode,
  toggledThemeMode,
  type ThemeMode,
} from "../app/utils/themeMode";

const THEME_COOKIE = "app-theme";

// Um único ouvinte de "prefers-color-scheme" para o app inteiro, mesmo com
// várias telas chamando o composable.
let systemListenerInstalled = false;

export const useThemeMode = () => {
  const themeCookie = useCookie<ThemeMode>(THEME_COOKIE, {
    default: () => "light",
    sameSite: "lax",
    // Um ano: antes o cookie era de sessão e o tema voltava ao claro.
    maxAge: 60 * 60 * 24 * 365,
  });

  // null = ainda não sabemos o tema do aparelho (servidor / antes de montar).
  const systemPrefersDark = useState<boolean | null>("system-prefers-dark", () => null);

  if (import.meta.client && !systemListenerInstalled) {
    systemListenerInstalled = true;
    const install = () => {
      if (typeof window.matchMedia !== "function") return;
      const query = window.matchMedia("(prefers-color-scheme: dark)");
      systemPrefersDark.value = query.matches;
      query.addEventListener?.("change", (event) => {
        systemPrefersDark.value = event.matches;
      });
    };
    // Depois da hidratação: nas telas com SSR o HTML veio claro e trocar
    // antes disso gera diferença entre servidor e cliente.
    onNuxtReady(install);
  }

  const themeMode = computed<ThemeMode>({
    get: () => normalizeThemeMode(themeCookie.value),
    set: (mode) => {
      themeCookie.value = normalizeThemeMode(mode);
    },
  });

  const resolvedTheme = computed(() => resolveThemeMode(themeMode.value, systemPrefersDark.value));
  const isDark = computed(() => resolvedTheme.value === "dark");
  const themeName = computed(() => (isDark.value ? "dark" : "light"));
  const themeClass = computed(() => (isDark.value ? "app-theme-dark" : "app-theme-light"));
  const themeColor = computed(() => (isDark.value ? "#12100e" : "#b5472a"));

  const setTheme = (mode: ThemeMode) => {
    themeMode.value = mode;
  };

  const toggleTheme = () => {
    setTheme(toggledThemeMode(themeMode.value, systemPrefersDark.value));
  };

  useHead({
    meta: [
      {
        key: "theme-color",
        name: "theme-color",
        content: themeColor,
      },
    ],
    htmlAttrs: {
      class: themeClass,
    },
  });

  return {
    isDark,
    themeClass,
    themeMode,
    themeName,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
};
