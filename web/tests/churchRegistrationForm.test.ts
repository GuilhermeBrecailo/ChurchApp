import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { parse } from "@vue/compiler-sfc";
import postcss from "postcss";

// O formulário "Crie sua igreja" saiu do Início (pages/index.vue): o
// primeiro uso mora em /onboarding/*.
const onboardingPagePath = new URL("../app/pages/onboarding/church.vue", import.meta.url);
const ministrySetupPath = new URL("../app/components/onboarding/ChurchMinistrySetup.vue", import.meta.url);

async function readVueFile(path: URL) {
  const source = await readFile(path, "utf8");
  const { descriptor, errors } = parse(source, { filename: path.pathname });
  assert.deepEqual(errors, []);
  return { source, descriptor };
}

function getDeclarations(rule: postcss.Rule | undefined) {
  return new Map(
    rule?.nodes
      .filter((node): node is postcss.Declaration => node.type === "decl")
      .map(({ prop, value, important }) => [prop, important ? `${value} !important` : value]),
  );
}

describe("formulário de criação da igreja", () => {
  it("separa os campos de endereço do campo de cidade e estado", async () => {
    const onboardingPage = await readVueFile(onboardingPagePath);
    const firstOnboardingAddressGrid = onboardingPage.source.match(/<div class="grid grid-cols-1 gap-4 sm:grid-cols-2[^"]*">[\s\S]*?label="Cidade"[\s\S]*?<\/div>/)?.[0];

    assert.ok(firstOnboardingAddressGrid);
    assert.match(firstOnboardingAddressGrid, /class="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4"/);
  });

  it("marca o nome da igreja como obrigatório", async () => {
    const onboardingPage = await readVueFile(onboardingPagePath);
    const onboardingNameField = onboardingPage.source.match(/<v-text-field\s+v-model="form\.name"[\s\S]*?\/>/)?.[0];

    assert.ok(onboardingNameField);
    assert.match(onboardingNameField, /\brequired\b/);
  });

  it("oculta o placeholder enquanto o campo de ministério está sem foco", async () => {
    const { descriptor } = await readVueFile(ministrySetupPath);
    const stylesheet = postcss.parse(descriptor.styles[0]?.content ?? "");
    const placeholderRule = stylesheet.nodes.find(
      (node): node is postcss.Rule =>
        node.type === "rule" &&
        node.selector.includes(".church-setup__custom") &&
        node.selector.includes(":not(.v-field--focused)") &&
        node.selector.includes(".v-field__input::placeholder"),
    );

    assert.equal(getDeclarations(placeholderRule).get("opacity"), "0 !important");
  });
});
