type ThemeMode = "light" | "dark";

const THEME_COOKIE = "app-theme";

export const useThemeMode = () => {
  const themeMode = useCookie<ThemeMode>(THEME_COOKIE, {
    default: () => "light",
    sameSite: "lax",
  });

  const isDark = computed(() => themeMode.value === "dark");
  const themeName = computed(() => (isDark.value ? "dark" : "light"));
  const themeClass = computed(() => (isDark.value ? "app-theme-dark" : "app-theme-light"));
  const themeColor = computed(() => (isDark.value ? "#111827" : "#4f46e5"));

  const setTheme = (mode: ThemeMode) => {
    themeMode.value = mode;
  };

  const toggleTheme = () => {
    setTheme(isDark.value ? "light" : "dark");
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
    setTheme,
    toggleTheme,
  };
};
