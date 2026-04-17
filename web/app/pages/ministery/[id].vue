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

    <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">
      {{ ministerioInfo.nome }}
    </h1>
    <p class="text-body-2 text-grey-darken-1 mb-6">
      Líder: {{ ministerioInfo.lider }}
    </p>

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

    <MinisteryNewMusicModal v-model="dialogEscala" />
    <MinisteryNewReferenceModal v-model="dialogMusica" />
    <MinisteryNewScaleModal v-model="dialogTarefa" />
  </div>
</template>

<script setup>
import { ArrowLeft, Plus, Calendar, Music, CheckSquare } from "lucide-vue-next";

const route = useRoute();
const router = useRouter();
const idDaRota = route.params.id;

// Dados Mockados e Estado (Mantidos exatamente iguais ao seu original)
const ministerioInfo = ref({ nome: "Carregando...", lider: "" });

const carregarDadosDoMinisterio = () => {
  const bancoDeDadosSimulado = {
    1: { nome: "Louvor", lider: "Ana Silva" },
    2: { nome: "Recepção", lider: "Carlos Oliveira" },
    3: { nome: "Som e Mídia", lider: "Pedro Santos" },
    4: { nome: "Intercessão", lider: "Maria Costa" },
    5: { nome: "Kids", lider: "Julia Fernandes" },
  };
  ministerioInfo.value = bancoDeDadosSimulado[idDaRota] || {
    nome: "Ministério não encontrado",
    lider: "N/A",
  };
};

carregarDadosDoMinisterio();

const activeTab = ref("musicas");
const tabs = [
  { label: "Escalas", value: "escalas", icon: Calendar },
  { label: "Músicas", value: "musicas", icon: Music },
  { label: "Tarefas", value: "tarefas", icon: CheckSquare },
];

const dialogEscala = ref(false);
const dialogMusica = ref(false);
const dialogTarefa = ref(false);

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
