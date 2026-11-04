import {
  GOOGLE_FONTS_STYLESHEET,
  VUETIFY_MDI_STYLESHEET,
} from "../../shared/deferredExternalStyles";

const addStylesheet = (id: string, href: string) => {
  if (document.getElementById(id)) return;

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
};

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook("app:mounted", () => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        addStylesheet("churchapp-google-fonts", GOOGLE_FONTS_STYLESHEET);
        addStylesheet("churchapp-vuetify-mdi", VUETIFY_MDI_STYLESHEET);
      });
    });
  });
});
