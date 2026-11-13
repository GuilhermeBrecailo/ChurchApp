import { computed, onMounted, ref } from "vue";
import { useServiceOccurrences, type UpcomingOccurrence } from "../useServiceOccurrences";
import { getScheduleCultOptions } from "../../app/utils/scaleSchedule";

/**
 * Cultos dos próximos 180 dias para vincular a uma escala nova (editor de
 * escala do ministério). Carrega ao montar, ou só quando pedido com
 * `{ lazy: true }`; se falhar, a escala ainda pode ser criada sem vínculo.
 */
export function useScheduleCultOptions(options: { lazy?: boolean } = {}) {
  const { listOccurrences } = useServiceOccurrences();
  const upcomingOccurrences = ref<UpcomingOccurrence[]>([]);
  const cultOptionsError = ref("");
  const cultOptions = computed(() => getScheduleCultOptions(upcomingOccurrences.value));

  const loadCultOptions = async () => {
    const { data, error } = await listOccurrences(180);

    if (error || !data) {
      upcomingOccurrences.value = [];
      cultOptionsError.value = "Não foi possível carregar os cultos. Você ainda pode criar a escala sem vínculo.";
      return;
    }

    upcomingOccurrences.value = data.upcoming ?? [];
    cultOptionsError.value = "";
  };

  if (!options.lazy) {
    onMounted(() => {
      void loadCultOptions();
    });
  }

  return { upcomingOccurrences, cultOptions, cultOptionsError, loadCultOptions };
}
