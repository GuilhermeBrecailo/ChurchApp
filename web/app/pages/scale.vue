<template>
  <div class="pa-4 bg-grey-lighten-4 min-vh-100">
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold text-grey-darken-4">Escalas</h1>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Confira os próximos cultos e eventos
        </p>
      </div>
      <v-btn color="#A855F7" class="rounded-lg text-none px-4" elevation="2">
        <Plus size="18" class="mr-1" /> Novo
      </v-btn>
    </div>

    <div class="d-flex gap-2 horizontal-scroll hide-scrollbar mb-8">
      <v-chip
        v-for="filter in filters"
        :key="filter"
        :variant="activeFilter === filter ? 'flat' : 'outlined'"
        :color="activeFilter === filter ? '#A855F7' : 'grey-darken-1'"
        class="font-weight-medium px-4 cursor-pointer"
        @click="activeFilter = filter"
      >
        {{ filter }}
      </v-chip>
    </div>

    <div>
      <ScaleScheduleSection
        v-for="(section, index) in filteredSchedules"
        :key="index"
        :title="section.category"
        :events="section.events"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { Plus } from "lucide-vue-next";

// Filtros disponíveis
const filters = [
  "Todos",
  "Louvor",
  "Recepção",
  "Som e Mídia",
  "Intercessão",
  "Kids",
];
const activeFilter = ref("Todos");

// Dados Simulados (Mock) baseados na sua imagem
const schedulesData = [
  {
    category: "LOUVOR",
    events: [
      {
        id: 1,
        title: "Culto Especial de Louvor",
        date: "25 de abril, sábado",
        time: "19:00",
        volunteerCount: 4,
        volunteers: [
          { initials: "AS" },
          { initials: "LP" },
          { initials: "ML" },
          { initials: "RM" },
        ],
      },
      {
        id: 2,
        title: "Culto de Quarta",
        date: "21 de abril, terça-feira",
        time: "19:30",
        volunteerCount: 2,
        volunteers: [{ initials: "AS" }, { initials: "RM" }],
      },
      {
        id: 3,
        title: "Culto de Domingo",
        date: "18 de abril, sábado",
        time: "19:00",
        volunteerCount: 3,
        volunteers: [
          { initials: "AS" },
          { initials: "LP" },
          { initials: "ML" },
        ],
      },
    ],
  },
  {
    category: "INTERCESSÃO",
    events: [
      {
        id: 4,
        title: "Culto de Quarta",
        date: "21 de abril, terça-feira",
        time: "19:00",
        volunteerCount: 0,
        volunteers: [],
      },
    ],
  },
];

// Lógica para filtrar as escalas ao clicar nas tags ("Todos", "Louvor", etc)
const filteredSchedules = computed(() => {
  if (activeFilter.value === "Todos") {
    return schedulesData;
  }
  return schedulesData.filter(
    (section) =>
      section.category.toLowerCase() === activeFilter.value.toLowerCase(),
  );
});
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}

.gap-2 {
  gap: 8px;
}

.horizontal-scroll {
  overflow-x: auto;
  flex-wrap: nowrap;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 4px; /* Espaço para o focus do chip */
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
