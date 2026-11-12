<script setup lang="ts">
/**
 * Transição entre telas. A chave é o caminho (sem a query): trocar só a
 * query (?aba=, ?schedule=, ?criar=) não pode recriar a página, senão cada
 * troca de aba recarrega tudo e fecha as janelas abertas.
 *
 * Com direção, como a navegação do iPhone:
 * - entrar num detalhe (/pessoas → /pessoas/123): a tela nova vem da direita;
 * - voltar (/pessoas/123 → /pessoas): vem da esquerda;
 * - trocar de aba (Início, Escalas, Igreja…): só esmaece, sem deslizar.
 */
import { ref } from "vue";
import { AnimatePresence, motion } from "motion-v";

const direction = ref(0);
// "Reduzir movimento" no sistema: a troca de tela só esmaece, sem deslizar.
const reduceMotion =
  import.meta.client && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const depth = (path: string) => path.split("/").filter(Boolean).length;

useRouter().beforeEach((to, from) => {
  if (to.path === from.path) return;
  const a = depth(from.path);
  const b = depth(to.path);
  // Abas de primeiro nível (/, /scale, /igreja, /user…) contam como irmãs.
  direction.value = reduceMotion || (a <= 1 && b <= 1) ? 0 : Math.sign(b - a);
});

// Curva das telas do iOS (sai rápido, assenta devagar).
const ease = [0.32, 0.72, 0, 1] as const;
const variants = {
  enter: (d: number) => ({ opacity: 0, x: d * 28 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.26, ease } },
  exit: (d: number) => ({ opacity: 0, x: d * -16, transition: { duration: 0.12, ease: "easeIn" } }),
};
</script>

<template>
  <NuxtPage v-slot="{ Component, route }">
    <AnimatePresence mode="wait" :custom="direction">
      <motion.div
        :key="route.path"
        :custom="direction"
        :variants="variants"
        initial="enter"
        animate="center"
        exit="exit"
      >
        <component :is="Component" />
      </motion.div>
    </AnimatePresence>
  </NuxtPage>
</template>
