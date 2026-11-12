import { computed, watch } from "vue";
import { getPrimaryTabs, resolveNavTier, type PrimaryTab } from "../app/utils/roleNavigation";
import { useAuth } from "./useAuth";
import { useDepartments } from "./useDepartments";

type LedMinistry = { id: string; name: string } | null;

/**
 * Abas principais (barra de baixo e lateral). Para o líder que cuida de um
 * ministério só, a aba "Ministérios" vira o nome dele ("Louvor") e abre
 * direto a página do ministério — sem a lista de um item só.
 */
export const usePrimaryTabs = () => {
  const { user } = useAuth();
  const { getDepartments } = useDepartments();
  // Guardado no estado do app: as duas barras usam e só busca uma vez por login.
  const ledMinistry = useState<LedMinistry>("nav-led-ministry", () => null);
  const loadedFor = useState<string | null>("nav-led-ministry-user", () => null);

  const tier = computed(() => resolveNavTier(user.value));

  const load = async () => {
    const key = user.value?.id && user.value?.activeChurchId ? `${user.value.id}:${user.value.activeChurchId}` : null;
    if (!import.meta.client || !key || tier.value !== "leader" || loadedFor.value === key) return;
    loadedFor.value = key;
    const { data } = await getDepartments();
    const mine = (data ?? []).filter((department) => department.canManageSchedule === true);
    ledMinistry.value = mine.length === 1 ? { id: mine[0]!.id, name: mine[0]!.name } : null;
  };

  watch(() => [user.value?.id, user.value?.activeChurchId, tier.value] as const, () => void load(), {
    immediate: true,
  });

  const tabs = computed<PrimaryTab[]>(() =>
    getPrimaryTabs(user.value).map((tab) =>
      tab.key === "ministries" && ledMinistry.value
        ? { ...tab, label: ledMinistry.value.name, title: ledMinistry.value.name, route: `/ministery/${ledMinistry.value.id}` }
        : tab,
    ),
  );

  return { tabs };
};
