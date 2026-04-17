<template>
  <v-card class="scale-card rounded-xl pa-5 mb-8 elevation-4">
    <div class="circle-decoration top-right"></div>
    <div class="circle-decoration bottom-left"></div>

    <div class="position-relative" style="z-index: 1">
      <p class="text-subtitle-2 text-white opacity-80 mb-1">
        Minha Próxima Escala
      </p>
      <h2 class="text-h6 font-weight-bold text-white mb-5">
        Culto Especial de Louvor
      </h2>

      <div class="d-flex align-center mb-3 text-white">
        <div class="icon-wrapper mr-3">
          <Calendar size="16" />
        </div>
        <span class="text-body-2 font-weight-medium">sábado, 25 de abril</span>
      </div>

      <div class="d-flex align-center mb-3 text-white">
        <div class="icon-wrapper mr-3">
          <Clock size="16" />
        </div>
        <span class="text-body-2 font-weight-medium">19:00</span>
      </div>

      <div class="d-flex align-center text-white">
        <div class="icon-wrapper mr-3">
          <Users size="16" />
        </div>
        <span class="text-body-2 font-weight-medium">Louvor</span>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { Calendar, Clock, Users } from "lucide-vue-next";
</script>

<style scoped>
.scale-card {
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%) !important;
  position: relative;
  overflow: hidden;
}

.icon-wrapper {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.opacity-80 {
  opacity: 0.8;
}

.circle-decoration {
  position: absolute;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.08);
}

.circle-decoration.top-right {
  width: 150px;
  height: 150px;
  top: -40px;
  right: -30px;
}

.circle-decoration.bottom-left {
  width: 100px;
  height: 100px;
  bottom: -30px;
  left: -20px;
}
</style>
