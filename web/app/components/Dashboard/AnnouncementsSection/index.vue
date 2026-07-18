<template>
  <section v-if="announcements.length" class="mb-8">
    <div class="d-flex justify-space-between align-center mb-3">
      <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
        Avisos
      </h3>
    </div>

    <div class="announcement-list">
      <v-card
        v-for="announcement in visibleAnnouncements"
        :key="announcement.id"
        class="rounded-xl pa-4 elevation-1 bg-white border-subtle"
      >
        <div class="d-flex align-center justify-space-between gap-3 mb-2">
          <div class="d-flex align-center min-w-0">
            <Megaphone size="17" color="var(--app-color-accent)" class="mr-2 flex-shrink-0" />
            <h4 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
              {{ announcement.title }}
            </h4>
          </div>
          <v-chip v-if="announcement.pinned" size="x-small" color="indigo-darken-2" variant="tonal">
            Fixado
          </v-chip>
        </div>
        <p class="announcement-body mb-2">
          {{ announcement.body }}
        </p>
        <p class="text-caption text-grey-darken-1 mb-0">
          {{ formatDate(announcement.publishedAt) }}
        </p>
      </v-card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Megaphone } from "lucide-vue-next";
import { useAnnouncements, type Announcement } from "../../../../composables/useAnnouncements";

const { getAnnouncements } = useAnnouncements();

const announcements = ref<Announcement[]>([]);
const visibleAnnouncements = computed(() => announcements.value.slice(0, 3));

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));

const loadAnnouncements = async () => {
  const { data } = await getAnnouncements();
  announcements.value = data ?? [];
};

onMounted(loadAnnouncements);
</script>

<style scoped>
.announcement-list {
  display: grid;
  gap: 12px;
}

.announcement-body {
  color: var(--app-color-text-soft);
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.45;
}

.border-subtle {
  border: 1px solid var(--app-color-border);
}

.gap-3 {
  gap: 12px;
}
</style>
