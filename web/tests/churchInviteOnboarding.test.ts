import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { parse } from "@vue/compiler-sfc";

const componentPath = (name: string) =>
  new URL(`../app/components/Onboarding/${name}.vue`, import.meta.url);

async function readVueSource(path: URL) {
  const source = await readFile(path, "utf8");
  const { descriptor, errors } = parse(source, { filename: path.pathname });
  assert.deepEqual(errors, []);
  return { source, descriptor };
}

describe("primeiro uso no Início", () => {
  it("troca o carrossel de boas-vindas por cartões no Início", async () => {
    assert.equal(existsSync(new URL("../app/components/OnboardingModal/index.vue", import.meta.url)), false);
    assert.equal(
      existsSync(new URL("../app/components/Dashboard/GettingStartedCard/index.vue", import.meta.url)),
      false,
    );

    const layout = await readFile(new URL("../app/layouts/default.vue", import.meta.url), "utf8");
    assert.doesNotMatch(layout, /<OnboardingModal/);
    assert.match(layout, /<UtilsToastHost \/>/);
  });

  it("pastor vê o checklist; membro e líder veem as boas-vindas", async () => {
    const { source } = await readVueSource(componentPath("HomeSlot"));

    assert.match(source, /<OnboardingSetupChecklist v-if="showChecklist"/);
    assert.match(source, /<OnboardingWelcomeCard v-else-if="showWelcome"/);
    assert.match(source, /isChurchManager/);
  });

  it("checklist mostra o progresso, abre a tela de verdade e dá para ocultar", async () => {
    const { source } = await readVueSource(componentPath("SetupChecklist"));

    assert.match(source, /Configure sua igreja/);
    assert.match(source, /summary\.done \}\} de \{\{ summary\.total/);
    assert.match(source, /Ocultar/);
    assert.match(source, /Tudo pronto! 🎉/);
    assert.match(source, /<OnboardingServiceTimesQuickSheet/);
    assert.match(source, /<OnboardingInviteSheet/);
    assert.match(source, /setActive\("setup-checklist"/);
  });

  it("convite: link, WhatsApp, QR, código e cadastrar eu mesmo", async () => {
    const { source } = await readVueSource(componentPath("InviteSheet"));

    assert.match(source, /Enviar no WhatsApp/);
    assert.match(source, /navigator\.clipboard\.writeText/);
    assert.match(source, /buildWhatsAppLink/);
    assert.match(source, /buildJoinLink\(window\.location\.origin/);
    assert.match(source, /<AdminInviteQrCode :value="inviteLink"/);
    assert.match(source, /inviteCode/);
    assert.match(source, /Cadastrar alguém eu mesmo/);
    assert.match(source, /to="\/pessoas"/);
  });

  it("horários sugeridos num toque, editáveis, salvos com createServiceTime", async () => {
    const { source } = await readVueSource(componentPath("ServiceTimesQuickSheet"));

    assert.match(source, /SERVICE_TIME_PRESETS/);
    assert.match(source, /createServiceTime\(/);
    assert.match(source, /v-model="draft\.time"/);
    assert.match(source, /v-model="draft\.weekday"/);
    assert.match(source, /UtilsResponsiveOverlay/);
  });

  it("boas-vindas do membro com o pedido de notificação e 'Entendi'", async () => {
    const { source } = await readVueSource(componentPath("WelcomeCard"));

    assert.match(source, /Boas-vindas à \{\{ churchName \}\}/);
    assert.match(source, /Avise-me quando eu for escalado/);
    assert.match(source, /Entendi/);
    assert.match(source, /Você lidera/);
    // Guardado por pessoa e igreja.
    assert.match(source, /churchapp:welcome-card:\$\{user\.value\?\.id/);
  });
});
