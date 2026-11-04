import type { RoleNavigationItem } from "./roleNavigation";
import { compareListText } from "./listOrdering";

export type NavigationGroup = {
  key: string;
  label: string;
  items: RoleNavigationItem[];
  /** Grupo de atalhos repetidos, exibido de forma compacta. */
  compact?: boolean;
};

const groupDefinitions = [
  {
    key: "routine",
    label: "Rotina da igreja",
    keys: new Set([
      "home",
      "pastoral",
      "visits",
      "people",
      "cults",
      "reports",
      "team",
      "scale",
      "ministries",
      "churchHub",
    ]),
  },
  {
    key: "content",
    label: "Conteúdo e cuidado",
    keys: new Set(["content", "prayer", "publications", "messages"]),
  },
  {
    key: "management",
    label: "Gestão e administração",
    keys: new Set(["churchAdmin", "rolesManagement", "settings", "churchProfile", "platformAdmin"]),
  },
  {
    key: "account",
    label: "Minha conta",
    keys: new Set(["profile"]),
  },
];

const byLabel = (first: RoleNavigationItem, second: RoleNavigationItem) =>
  compareListText(first.label, second.label);

/**
 * Agrupa os atalhos de navegação por assunto (rotina, conteúdo, gestão, conta).
 * Itens fora dos grupos conhecidos vão para "Outros atalhos". Grupos vazios
 * são removidos.
 */
export function groupNavigationItems(items: RoleNavigationItem[]): NavigationGroup[] {
  const knownKeys = new Set(groupDefinitions.flatMap((group) => [...group.keys]));
  const groups: NavigationGroup[] = groupDefinitions.map((group) => ({
    key: group.key,
    label: group.label,
    items: items.filter((entry) => group.keys.has(entry.key)).sort(byLabel),
  }));
  const otherItems = items.filter((entry) => !knownKeys.has(entry.key)).sort(byLabel);

  if (otherItems.length) {
    groups.push({ key: "other", label: "Outros atalhos", items: otherItems });
  }

  return groups.filter((group) => group.items.length > 0);
}
