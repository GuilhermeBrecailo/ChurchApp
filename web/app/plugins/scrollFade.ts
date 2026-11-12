/**
 * v-scroll-fade: numa fileira que rola de lado (filtros, chips), esmaece a
 * borda onde ainda tem conteúdo escondido. Assim ninguém vê um item "cortado"
 * sem saber que dá para arrastar.
 */
type FadeElement = HTMLElement & { __scrollFade?: () => void; __scrollFadeObserver?: ResizeObserver };

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive("scroll-fade", {
    mounted(el: FadeElement) {
      const update = () => {
        el.classList.toggle("scroll-fade--start", el.scrollLeft > 4);
        el.classList.toggle("scroll-fade--end", el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
      };
      el.__scrollFade = update;
      el.addEventListener("scroll", update, { passive: true });
      if (typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver(update);
        observer.observe(el);
        el.__scrollFadeObserver = observer;
      }
      requestAnimationFrame(update);
    },
    updated(el: FadeElement) {
      requestAnimationFrame(() => el.__scrollFade?.());
    },
    unmounted(el: FadeElement) {
      if (el.__scrollFade) el.removeEventListener("scroll", el.__scrollFade);
      el.__scrollFadeObserver?.disconnect();
    },
    getSSRProps: () => ({}),
  });
});
