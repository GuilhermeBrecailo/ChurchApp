import { defineNuxtModule } from "@nuxt/kit";
import { VUETIFY_MDI_STYLESHEET } from "../shared/deferredExternalStyles";

export default defineNuxtModule({
  meta: {
    name: "churchapp-defer-vuetify-mdi-styles",
  },
  setup(_options, nuxt) {
    nuxt.hook("modules:done", () => {
      const links = nuxt.options.app.head.link;

      if (!links) return;

      nuxt.options.app.head.link = links.filter(
        (link) => link.href !== VUETIFY_MDI_STYLESHEET,
      );
    });
  },
});
