<template>
  <div class="pa-4 bg-grey-lighten-4 min-vh-100">
    <div class="d-flex align-center mb-4">
      <v-btn icon variant="text" @click="router.back()" class="mr-2">
        <ArrowLeft size="20" />
      </v-btn>
      <span class="text-body-2 text-grey-darken-1 font-weight-medium"
        >Ministérios</span
      >
    </div>

    <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">Louvor</h1>
    <p class="text-body-2 text-grey-darken-1 mb-6">Líder: Ana Silva</p>

    <div class="d-flex gap-2 mb-6">
      <v-chip
        v-for="tab in tabs"
        :key="tab.value"
        :variant="activeTab === tab.value ? 'flat' : 'outlined'"
        :color="activeTab === tab.value ? '#A855F7' : 'grey-darken-1'"
        class="font-weight-medium px-4 cursor-pointer"
        @click="activeTab = tab.value"
      >
        <component :is="tab.icon" size="16" class="mr-2" /> {{ tab.label }}
      </v-chip>
    </div>

    <div v-if="activeTab === 'escalas'">
      <div class="d-flex justify-end mb-4">
        <v-btn
          color="#A855F7"
          class="rounded-lg text-none"
          @click="dialogEscala = true"
        >
          <Plus size="18" class="mr-1" /> Nova Escala
        </v-btn>
      </div>
      <div class="text-center py-10 text-grey-darken-1 text-body-2">
        Nenhuma escala ainda
      </div>
    </div>

    <div v-if="activeTab === 'musicas'">
      <div class="d-flex justify-end mb-4">
        <v-btn
          color="#A855F7"
          class="rounded-lg text-none"
          @click="dialogMusica = true"
        >
          <Plus size="18" class="mr-1" /> Nova Música
        </v-btn>
      </div>
      <div>
        <MinisteryMusicCard
          v-for="musica in listaMusicas"
          :key="musica.id"
          :musica="musica"
        />
      </div>
    </div>

    <div v-if="activeTab === 'tarefas'">
      <div class="d-flex justify-end mb-4">
        <v-btn
          color="#A855F7"
          class="rounded-lg text-none"
          @click="dialogTarefa = true"
        >
          <Plus size="18" class="mr-1" /> Nova Tarefa
        </v-btn>
      </div>
      <div class="text-center py-10 text-grey-darken-1 text-body-2">
        Nenhuma tarefa ainda
      </div>
    </div>

    <v-dialog v-model="dialogEscala" max-width="400">
      <v-card class="rounded-xl pa-4">
        <div class="d-flex justify-space-between align-center mb-4">
          <h3 class="text-subtitle-1 font-weight-bold text-center flex-grow-1">
            Novo Culto / Evento
          </h3>
          <v-btn icon variant="text" size="small" @click="dialogEscala = false"
            ><X size="20"
          /></v-btn>
        </div>
        <v-text-field
          label="Título *"
          placeholder="ex: Culto de Domingo"
          variant="outlined"
          density="compact"
          class="mb-2"
        ></v-text-field>
        <div class="d-flex gap-2 mb-2">
          <v-text-field
            label="Data *"
            type="date"
            variant="outlined"
            density="compact"
            class="flex-grow-1"
          ></v-text-field>
          <v-text-field
            label="Horário"
            type="time"
            variant="outlined"
            density="compact"
            class="flex-grow-1"
          ></v-text-field>
        </div>
        <v-select
          label="Ministério *"
          :items="['Louvor', 'Intercessão']"
          variant="outlined"
          density="compact"
          class="mb-4"
        ></v-select>
        <v-btn
          color="#A855F7"
          block
          class="text-none rounded-lg"
          @click="dialogEscala = false"
          >Salvar Escala</v-btn
        >
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogMusica" max-width="400">
      <v-card class="rounded-xl pa-4">
        <div class="d-flex justify-space-between align-center mb-4">
          <h3 class="text-subtitle-1 font-weight-bold text-center flex-grow-1">
            Nova Música
          </h3>
          <v-btn icon variant="text" size="small" @click="dialogMusica = false"
            ><X size="20"
          /></v-btn>
        </div>
        <v-text-field
          label="Título *"
          variant="outlined"
          density="compact"
          class="mb-2"
        ></v-text-field>
        <v-text-field
          label="Artista"
          variant="outlined"
          density="compact"
          class="mb-2"
        ></v-text-field>
        <div class="d-flex gap-2 mb-2">
          <v-text-field
            label="Tom"
            placeholder="ex: G, Am"
            variant="outlined"
            density="compact"
          ></v-text-field>
          <v-text-field
            label="BPM"
            placeholder="ex: 72"
            variant="outlined"
            density="compact"
          ></v-text-field>
        </div>
        <v-select
          label="Categoria"
          :items="['Adoração', 'Louvor', 'Hino']"
          variant="outlined"
          density="compact"
          class="mb-2"
        ></v-select>
        <v-text-field
          label="Link da Cifra"
          placeholder="https://..."
          variant="outlined"
          density="compact"
          class="mb-4"
        ></v-text-field>
        <v-btn
          color="#A855F7"
          block
          class="text-none rounded-lg"
          @click="dialogMusica = false"
          >Salvar Música</v-btn
        >
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogTarefa" max-width="400">
      <v-card class="rounded-xl pa-4">
        <div class="d-flex justify-space-between align-center mb-4">
          <h3 class="text-subtitle-1 font-weight-bold text-center flex-grow-1">
            Nova Tarefa
          </h3>
          <v-btn icon variant="text" size="small" @click="dialogTarefa = false"
            ><X size="20"
          /></v-btn>
        </div>
        <v-text-field
          label="Título *"
          placeholder="O que precisa ser feito?"
          variant="outlined"
          density="compact"
          class="mb-2"
        ></v-text-field>
        <v-text-field
          label="Descrição"
          placeholder="Detalhes..."
          variant="outlined"
          density="compact"
          class="mb-2"
        ></v-text-field>
        <v-text-field
          label="Responsável"
          placeholder="Nome do responsável"
          variant="outlined"
          density="compact"
          class="mb-4"
        ></v-text-field>
        <v-btn
          color="#A855F7"
          block
          class="text-none rounded-lg"
          @click="dialogTarefa = false"
          >Criar Tarefa</v-btn
        >
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowLeft,
  Plus,
  Calendar,
  Music,
  CheckSquare,
  X,
} from "lucide-vue-next";

const router = useRouter();

// Controle de Abas
const activeTab = ref("musicas"); // Começando na aba músicas para exemplo
const tabs = [
  { label: "Escalas", value: "escalas", icon: Calendar },
  { label: "Músicas", value: "musicas", icon: Music },
  { label: "Tarefas", value: "tarefas", icon: CheckSquare },
];

// Controle dos Modais
const dialogEscala = ref(false);
const dialogMusica = ref(false);
const dialogTarefa = ref(false);

// Dados Mockados da Aba de Músicas
const listaMusicas = [
  {
    id: 1,
    titulo: "Bondade de Deus",
    artista: "Isaias Saad",
    tom: "G",
    bpm: "72",
    categoria: "Adoração",
  },
  {
    id: 2,
    titulo: "Deus É Deus",
    artista: "Delino Marçal",
    tom: "C",
    bpm: "82",
    categoria: "Louvor",
  },
  {
    id: 3,
    titulo: "Eu Vou Subir a Montanha",
    artista: "Fernandinho",
    tom: "E",
    bpm: "140",
    categoria: "Louvor",
  },
  {
    id: 4,
    titulo: "Lugar Secreto",
    artista: "Gabriela Rocha",
    tom: "E",
    bpm: "68",
    categoria: "Adoração",
  },
  {
    id: 5,
    titulo: "Maravilhosa Graça",
    artista: "Prisma Brasil",
    tom: "Eb",
    bpm: "60",
    categoria: "Hino",
  },
];
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
.gap-2 {
  gap: 8px;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
