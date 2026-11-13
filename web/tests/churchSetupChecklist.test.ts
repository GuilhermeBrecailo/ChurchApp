import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSetupSteps,
  EMPTY_SETUP_COUNTS,
  isDuplicateServiceTime,
  resolveChecklistVisibility,
  SERVICE_TIME_PRESETS,
  summarizeSetup,
  validateServiceTimeDraft,
  type SetupCounts,
} from "../app/utils/churchSetupChecklist";

const counts = (overrides: Partial<SetupCounts> = {}): SetupCounts => ({
  ...EMPTY_SETUP_COUNTS,
  ...overrides,
});

const complete = counts({
  serviceTimes: 2,
  departments: 1,
  activeMembers: 3,
  schedules: 1,
  hasLogo: true,
});

describe("checklist Configure sua igreja", () => {
  it("começa andando: igreja criada já conta (1 de 6)", () => {
    const steps = buildSetupSteps(counts());
    const summary = summarizeSetup(steps);

    assert.equal(steps.length, 6);
    assert.equal(steps[0]?.key, "church");
    assert.equal(steps[0]?.done, true);
    assert.equal(summary.label, "Configure sua igreja · 1 de 6");
    assert.equal(summary.nextKey, "service-times");
  });

  it("cada passo conta como feito pelos dados reais", () => {
    const done = (key: string, overrides: Partial<SetupCounts>) =>
      buildSetupSteps(counts(overrides)).find((step) => step.key === key)?.done;

    assert.equal(done("service-times", { serviceTimes: 1 }), true);
    assert.equal(done("ministry", { departments: 1 }), true);
    assert.equal(done("invite", { activeMembers: 1 }), false);
    assert.equal(done("invite", { activeMembers: 2 }), true);
    assert.equal(done("invite", { pendingMembers: 1 }), true);
    assert.equal(done("schedule", { schedules: 1 }), true);
    assert.equal(done("public-page", { hasLogo: true }), true);
    assert.equal(done("public-page", { hasWelcomeMessage: true }), true);
  });

  it("a primeira escala fica bloqueada até existir um ministério", () => {
    const withoutMinistry = buildSetupSteps(counts({ serviceTimes: 1, activeMembers: 2 }));
    const schedule = withoutMinistry.find((step) => step.key === "schedule");
    assert.equal(schedule?.locked, true);
    assert.equal(schedule?.lockedHint, "Crie um ministério primeiro.");
    assert.equal(summarizeSetup(withoutMinistry).nextKey, "ministry");

    const withMinistry = buildSetupSteps(counts({ serviceTimes: 1, departments: 1, activeMembers: 2 }));
    assert.equal(withMinistry.find((step) => step.key === "schedule")?.locked, false);
    assert.equal(summarizeSetup(withMinistry).nextKey, "schedule");
  });

  it("só o próximo passo pendente fica aberto, pulando os bloqueados", () => {
    const steps = buildSetupSteps(counts({ serviceTimes: 1, activeMembers: 2, hasLogo: false }));
    // ministério pendente vem antes; escala bloqueada é pulada.
    assert.equal(summarizeSetup(steps).nextKey, "ministry");
  });

  it("cada passo abre a tela de verdade", () => {
    const steps = buildSetupSteps(counts(), { slug: "igreja-x" });
    const byKey = Object.fromEntries(steps.map((step) => [step.key, step]));

    assert.deepEqual(byKey["service-times"]?.action, { kind: "sheet", sheet: "service-times" });
    assert.deepEqual(byKey.ministry?.action, { kind: "link", to: "/ministery?criar=1" });
    assert.deepEqual(byKey.invite?.action, { kind: "sheet", sheet: "invite" });
    assert.deepEqual(byKey.schedule?.action, { kind: "link", to: "/scale?nova=1" });
    assert.deepEqual(byKey["public-page"]?.action, { kind: "link", to: "/configuracoes/pagina-publica" });
    assert.deepEqual(byKey["public-page"]?.secondaryAction, { kind: "link", to: "/c/igreja-x" });
  });

  it("completo: mostra 'Tudo pronto' uma vez e depois some", () => {
    const summary = summarizeSetup(buildSetupSteps(complete));
    assert.equal(summary.allDone, true);
    assert.equal(summary.nextKey, null);
    assert.equal(summary.label, "Configure sua igreja · 6 de 6");

    assert.equal(
      resolveChecklistVisibility(summary, { hidden: false, celebrated: false, seenIncomplete: true }),
      "celebration",
    );
    assert.equal(
      resolveChecklistVisibility(summary, { hidden: false, celebrated: true, seenIncomplete: true }),
      "hidden",
    );
    // Igreja antiga já completa: nada aparece.
    assert.equal(
      resolveChecklistVisibility(summary, { hidden: false, celebrated: false, seenIncomplete: false }),
      "hidden",
    );
  });

  it("'Ocultar' esconde mesmo com passos pendentes", () => {
    const summary = summarizeSetup(buildSetupSteps(counts()));
    assert.equal(
      resolveChecklistVisibility(summary, { hidden: true, celebrated: false, seenIncomplete: true }),
      "hidden",
    );
    assert.equal(
      resolveChecklistVisibility(summary, { hidden: false, celebrated: false, seenIncomplete: false }),
      "checklist",
    );
  });
});

describe("horários sugeridos", () => {
  it("oferece Domingo 10h, Domingo 19h e Quarta 19h30", () => {
    assert.deepEqual(
      SERVICE_TIME_PRESETS.map(({ chip, weekday, time }) => [chip, weekday, time]),
      [
        ["Domingo 10h", 0, "10:00"],
        ["Domingo 19h", 0, "19:00"],
        ["Quarta 19h30", 3, "19:30"],
      ],
    );
  });

  it("valida o horário editado", () => {
    assert.equal(validateServiceTimeDraft({ label: "Culto", weekday: 0, time: "10:00" }), "");
    assert.equal(validateServiceTimeDraft({ label: " ", weekday: 0, time: "10:00" }), "Dê um nome ao culto.");
    assert.equal(validateServiceTimeDraft({ label: "Culto", weekday: 9, time: "10:00" }), "Escolha o dia da semana.");
    assert.equal(
      validateServiceTimeDraft({ label: "Culto", weekday: 0, time: "25:00" }),
      "Confira o horário (ex.: 19:30).",
    );
  });

  it("não repete um horário que já existe", () => {
    const existing = [{ weekday: 0, time: "10:00" }, { weekday: 3, time: "19:30", isActive: false }];
    assert.equal(isDuplicateServiceTime({ label: "x", weekday: 0, time: "10:00" }, existing), true);
    assert.equal(isDuplicateServiceTime({ label: "x", weekday: 3, time: "19:30" }, existing), false);
  });
});
