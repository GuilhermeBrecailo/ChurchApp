<template>
  <div class="pa-4 pb-8 app-operational-page gestao-page">
    <UtilsPageHeader
      title="Gestão"
      :subtitle="churchName ? `Ferramentas para cuidar da ${churchName}` : undefined"
      help-title="Gestão da igreja"
    />

    <UtilsEmptyState
      v-if="!groups.length"
      variant="no-permission"
      :icon="LayoutGrid"
      title="Gestão indisponível"
      description="Esta área é de quem cuida da igreja: pastor ou pessoas com cargo de gestão. Fale com seu pastor se precisar de acesso."
    />

    <div v-else class="gestao-groups">
      <section
        v-for="group in groups"
        :key="group.key"
        class="gestao-group"
        :aria-labelledby="`gestao-${group.key}`"
      >
        <UtilsSectionHeader :id="`gestao-${group.key}`" :title="group.label" />
        <div class="gestao-tiles">
          <NuxtLink
            v-for="item in group.items"
            :key="item.key"
            :to="item.route"
            class="gestao-tile app-surface app-interactive-surface"
          >
            <span class="gestao-tile-icon" aria-hidden="true">
              <component :is="navigationIcons[item.icon]" size="22" />
            </span>
            <span class="gestao-tile-copy">
              <span class="gestao-tile-title">{{ item.label }}</span>
              <span class="gestao-tile-description">{{ item.description }}</span>
              <span
                v-if="counts[item.key]"
                class="gestao-tile-count"
                :class="{ 'gestao-tile-count--attention': counts[item.key]?.attention }"
              >
                {{ counts[item.key]?.label }}
              </span>
            </span>
            <ChevronRight size="18" class="gestao-chevron" aria-hidden="true" />
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from "vue";
import { ChevronRight, LayoutGrid } from "lucide-vue-next";
import { useAuth } from "../../../composables/useAuth";
import { useDepartments } from "../../../composables/useDepartments";
import { useMembers } from "../../../composables/useMembers";
import { usePastoral } from "../../../composables/usePastoral";
import { usePrayerRequests } from "../../../composables/usePrayerRequests";
import { resolveChurchAccess } from "../../utils/churchAccess";
import { getManagementItems } from "../../utils/roleNavigation";
import { navigationIcons } from "../../utils/navigationIcons";

const router = useRouter();
const { user } = useAuth();
const { getPendingMembers } = useMembers();
const { getDashboard } = usePastoral();
const { getPendingPrayerRequests } = usePrayerRequests();
const { getDepartments } = useDepartments();

const groups = computed(() => getManagementItems(user.value));
const churchName = computed(() => user.value?.activeChurch?.name || user.value?.church?.name || "");
const itemKeys = computed(() => new Set(groups.value.flatMap((group) => group.items.map((item) => item.key))));

type TileCount = { label: string; attention: boolean };
const counts = reactive<Record<string, TileCount | undefined>>({});

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Contagens baratas, uma chamada por fonte, só para os itens visíveis. */
const loadCounts = async () => {
  const keys = itemKeys.value;
  const access = resolveChurchAccess(user.value as never);

  await Promise.all([
    keys.has("people") && access.canManagePeople
      ? getPendingMembers().then(({ data }) => {
          if (data?.length) counts.people = { label: plural(data.length, "pendente", "pendentes"), attention: true };
        })
      : null,
    keys.has("care")
      ? getDashboard().then(({ data }) => {
          const parts = [
            data?.stats.visitorsToFollowUp
              ? plural(data.stats.visitorsToFollowUp, "visitante", "visitantes")
              : "",
            data?.stats.openVisits ? plural(data.stats.openVisits, "visita", "visitas") : "",
          ].filter(Boolean);
          if (parts.length) counts.care = { label: parts.join(" · "), attention: true };
          if (keys.has("prayerReview") && data?.stats.pendingPrayers) {
            counts.prayerReview = {
              label: `${data.stats.pendingPrayers} para revisar`,
              attention: true,
            };
          }
        })
      : null,
    keys.has("prayerReview") && !keys.has("care")
      ? getPendingPrayerRequests(1).then(({ data }) => {
          if (data?.total) counts.prayerReview = { label: `${data.total} para revisar`, attention: true };
        })
      : null,
    keys.has("ministries")
      ? getDepartments().then(({ data }) => {
          const active = (data ?? []).filter((ministry) => ministry.isActive !== false).length;
          if (active) counts.ministries = { label: plural(active, "ministério", "ministérios"), attention: false };
        })
      : null,
  ]);
};

onMounted(() => {
  // Admin da plataforma sem igreja: não há gestão de igreja para mostrar.
  if (user.value?.hasChurch !== true && user.value?.is_admin === true) {
    router.replace("/platform-admin");
    return;
  }
  if (groups.value.length) loadCounts();
});

useHead({ title: "Gestão" });
</script>

<style scoped>
.gestao-page {
  max-width: 1120px;
  margin: 0 auto;
}

.gestao-groups {
  display: grid;
  gap: 28px;
}

.gestao-group {
  display: grid;
  gap: 10px;
}

.gestao-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 330px), 1fr));
  gap: 10px;
}

.gestao-tile {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 72px;
  padding: 14px;
  color: var(--app-color-text);
  text-decoration: none;
}

.gestao-tile:focus-visible {
  outline: none;
  box-shadow: var(--app-focus-ring);
}

.gestao-tile-icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.gestao-tile-copy {
  display: grid;
  flex: 1 1 auto;
  gap: 2px;
  min-width: 0;
}

.gestao-tile-title {
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.3;
}

.gestao-tile-description {
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
  line-height: 1.35;
}

.gestao-tile-count {
  justify-self: start;
  margin-top: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--app-color-surface-soft);
  color: var(--app-color-text-soft);
  font-size: 0.78rem;
  font-weight: 800;
}

.gestao-tile-count--attention {
  background: var(--app-color-warning-tint);
  color: var(--app-color-text);
}

.gestao-chevron {
  flex: 0 0 auto;
  color: var(--app-color-text-muted);
}
</style>
