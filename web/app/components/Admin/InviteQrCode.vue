<template>
  <canvas v-if="value" ref="canvasRef" class="invite-qr-canvas" :aria-label="`QR code para ${value}`" />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import QRCode from "qrcode";

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

  QRCode.toCanvas(canvas, props.value, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: props.size,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
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
