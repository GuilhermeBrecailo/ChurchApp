<template>
  <div class="pa-4 bg-grey-lighten-4 min-vh-100 pb-20">
    <div class="mb-6">
      <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">
        Meu Perfil
      </h1>
      <p class="text-body-2 text-grey-darken-1 mb-0">
        Suas informações e disponibilidade
      </p>
    </div>

    <div class="d-flex align-center mb-6 px-2">
      <v-avatar
        size="56"
        color="#EEF2FF"
        class="mr-4 text-#A855F7 font-weight-bold text-h6"
      >
        gb
      </v-avatar>
      <div>
        <h2
          class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0"
          style="line-height: 1.2"
        >
          gui brecailo
        </h2>
        <p class="text-caption text-grey-darken-1 mb-1">brecailo3@gmail.com</p>
        <v-chip
          size="x-small"
          color="#6366f1"
          variant="flat"
          class="font-weight-bold px-2 rounded-sm"
        >
          Admin
        </v-chip>
      </div>
    </div>

    <v-card class="rounded-xl pa-4 mb-4 elevation-1 bg-white border-subtle">
      <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-4">
        Ministério
      </h3>

      <div class="text-caption font-weight-medium text-grey-darken-2 mb-1">
        Ministério principal
      </div>
      <v-select
        v-model="form.ministerio"
        :items="['Louvor', 'Recepção', 'Som e Mídia', 'Intercessão', 'Kids']"
        placeholder="Selecione um ministério..."
        variant="outlined"
        density="compact"
        class="mb-4"
        hide-details
      ></v-select>

      <div class="text-caption font-weight-medium text-grey-darken-2 mb-1">
        O que você faz
      </div>
      <v-text-field
        v-model="form.funcao"
        placeholder="ex: Vocalista, Guitarrista, Professor..."
        variant="outlined"
        density="compact"
        hide-details
      ></v-text-field>
    </v-card>

    <v-card class="rounded-xl pa-4 mb-4 elevation-1 bg-white border-subtle">
      <div class="d-flex align-center mb-1">
        <CalendarX size="18" class="mr-2 text-#A855F7" />
        <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
          Indisponibilidade
        </h3>
      </div>
      <p class="text-caption text-grey-darken-1 mb-4">
        Marque as datas em que você não poderá servir:
      </p>

      <div class="d-flex gap-2 mb-3 align-center">
        <v-text-field
          v-model="novaData"
          type="date"
          variant="outlined"
          density="compact"
          hide-details
          class="flex-grow-1"
        ></v-text-field>

        <v-btn
          variant="outlined"
          color="grey-darken-1"
          class="rounded-lg bg-white"
          size="40"
          icon
          @click="adicionarData"
        >
          <Plus size="20" />
        </v-btn>
      </div>

      <div
        v-if="datasIndisponiveis.length === 0"
        class="text-caption text-grey-darken-1 font-italic mt-2"
      >
        Nenhuma data bloqueada
      </div>
      <div v-else class="d-flex flex-wrap gap-2 mt-3">
        <v-chip
          v-for="(data, index) in datasIndisponiveis"
          :key="index"
          closable
          @click:close="removerData(index)"
          color="#A855F7"
          variant="tonal"
          size="small"
          class="font-weight-medium"
        >
          {{ formatarData(data) }}
        </v-chip>
      </div>
    </v-card>

    <v-card class="rounded-xl pa-4 mb-4 elevation-1 bg-white border-subtle">
      <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-3">
        Sugestão
      </h3>
      <v-textarea
        v-model="form.sugestao"
        placeholder="Compartilhe alguma sugestão com os líderes..."
        variant="outlined"
        density="compact"
        hide-details
        rows="3"
        auto-grow
      ></v-textarea>
    </v-card>

    <v-card class="rounded-xl pa-4 mb-6 elevation-1 bg-white border-subtle">
      <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-3">
        Contato
      </h3>
      <div class="text-caption font-weight-medium text-grey-darken-2 mb-1">
        Telefone / WhatsApp
      </div>
      <v-text-field
        v-model="form.telefone"
        placeholder="(00) 00000-0000"
        variant="outlined"
        density="compact"
        hide-details
      ></v-text-field>
    </v-card>

    <v-btn
      color="#A855F7"
      block
      class="text-none rounded-lg font-weight-medium elevation-2"
      size="large"
      @click="salvarPerfil"
    >
      <Save size="18" class="mr-2" /> Salvar Perfil
    </v-btn>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { CalendarX, Plus, Save } from "lucide-vue-next";

// Dados do formulário
const form = ref({
  ministerio: null,
  funcao: "",
  sugestao: "",
  telefone: "",
});

// Controle da Indisponibilidade
const novaData = ref("");
const datasIndisponiveis = ref([]);

const adicionarData = () => {
  if (novaData.value && !datasIndisponiveis.value.includes(novaData.value)) {
    datasIndisponiveis.value.push(novaData.value);
    // Ordena as datas cronologicamente
    datasIndisponiveis.value.sort();
    novaData.value = ""; // Limpa o campo
  }
};

const removerData = (index) => {
  datasIndisponiveis.value.splice(index, 1);
};

// Converte 'YYYY-MM-DD' para 'DD/MM/YYYY' apenas para exibição
const formatarData = (dataIso) => {
  if (!dataIso) return "";
  const partes = dataIso.split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

// Ação de Salvar
const salvarPerfil = () => {
  const perfilCompleto = {
    ...form.value,
    indisponibilidades: datasIndisponiveis.value,
  };

  console.log("Salvando dados do perfil:", perfilCompleto);
  // Aqui entraria a sua requisição para API (ex: $fetch('/api/user', { ... }))
  alert("Perfil salvo com sucesso!");
};
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
/* Espaço extra no rodapé para não esconder o botão Salvar atrás do Bottom Navigation */
.pb-20 {
  padding-bottom: 90px !important;
}
.gap-2 {
  gap: 8px;
}
.border-subtle {
  border: 1px solid #f3f4f6;
}
</style>
