<template>
  <canvas v-if="value" ref="canvasRef" class="invite-qr-canvas" :aria-label="`QR code para ${value}`" />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import qrcode from "qrcode-generator";

const props = withDefaults(
  defineProps<{
    value: string;
    size?: number;
  }>(),
  {
    size: 176,
  },
);

const canvasRef = ref<HTMLCanvasElement | null>(null);

const render = () => {
  const canvas = canvasRef.value;
  if (!canvas || !props.value) return;

  // typeNumber 0 deixa a lib escolher a menor versao do QR que caiba no
  // conteudo; correcao de erro "M" e o padrao equilibrado (tolera sujeira/
  // dobra no papel sem deixar o QR maior que o necessario).
  const qr = qrcode(0, "M");
  qr.addData(props.value);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const cellSize = Math.floor(props.size / moduleCount) || 1;
  const pixelSize = cellSize * moduleCount;

  canvas.width = pixelSize;
  canvas.height = pixelSize;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, pixelSize, pixelSize);
  ctx.fillStyle = "#000000";

  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (qr.isDark(row, col)) {
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
  }
};

onMounted(render);
watch(() => props.value, render);
</script>

<style scoped>
.invite-qr-canvas {
  display: block;
  width: 100%;
  max-width: 176px;
  height: auto;
  border-radius: 12px;
  background: #ffffff;
  padding: 10px;
  box-sizing: border-box;
}
</style>
