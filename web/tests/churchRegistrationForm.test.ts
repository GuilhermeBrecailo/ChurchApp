import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { parse } from "@vue/compiler-sfc";
import postcss from "postcss";

const rootPagePath = new URL("../app/pages/index.vue", import.meta.url);
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
    const rootPage = await readVueFile(rootPagePath);
    const onboardingPage = await readVueFile(onboardingPagePath);
    const firstRootAddressGrid = rootPage.source.match(/<div class="responsive-grid[^"]*">[\s\S]*?label="Cidade"[\s\S]*?<\/div>/)?.[0];
    const firstOnboardingAddressGrid = onboardingPage.source.match(/<div class="grid grid-cols-1 gap-4 sm:grid-cols-2[^"]*">[\s\S]*?label="Cidade"[\s\S]*?<\/div>/)?.[0];

    assert.ok(firstRootAddressGrid);
    assert.ok(firstOnboardingAddressGrid);
    assert.match(firstRootAddressGrid, /class="responsive-grid mb-4"/);
    assert.match(firstOnboardingAddressGrid, /class="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4"/);
  });

  it("marca o nome da igreja como obrigatório nas duas telas", async () => {
    const rootPage = await readVueFile(rootPagePath);
    const onboardingPage = await readVueFile(onboardingPagePath);
    const rootNameField = rootPage.source.match(/<v-text-field\s+v-model="churchForm\.name"[\s\S]*?\/>/)?.[0];
    const onboardingNameField = onboardingPage.source.match(/<v-text-field\s+v-model="form\.name"[\s\S]*?\/>/)?.[0];

    assert.ok(rootNameField);
    assert.ok(onboardingNameField);
    assert.match(rootNameField, /\brequired\b/);
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
