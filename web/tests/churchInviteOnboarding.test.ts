import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { parse } from "@vue/compiler-sfc";

const homePagePath = new URL("../app/pages/index.vue", import.meta.url);
const gettingStartedPath = new URL(
  "../app/components/Dashboard/GettingStartedCard/index.vue",
  import.meta.url,
);

async function readVueSource(path: URL) {
  const source = await readFile(path, "utf8");
  const { descriptor, errors } = parse(source, { filename: path.pathname });
  assert.deepEqual(errors, []);
  return { source, descriptor };
}

describe("convite de pessoas no primeiro acesso", () => {
  it("mostra os primeiros passos mesmo quando a igreja já tem ministérios", async () => {
    const { source } = await readVueSource(homePagePath);
    const needsSetup = source.match(/const needsSetup = computed\([\s\S]*?\n\);/)?.[0];

    assert.ok(needsSetup);
    assert.match(needsSetup, /churchMembersCount\.value <= 1/);
    assert.match(needsSetup, /canManageChurchMembers\.value/);
    assert.doesNotMatch(needsSetup, /churchDepartmentsCount\.value === 0/);
  });

  it("oferece copiar e enviar no WhatsApp um link que abre o cadastro por convite", async () => {
    const { source } = await readVueSource(gettingStartedPath);

    assert.match(source, /Enviar no WhatsApp/);
    assert.match(source, /navigator\.clipboard\.writeText/);
    assert.match(source, /https:\/\/wa\.me\/\?text=/);
    assert.match(source, /\/join\?code=/);
    assert.match(source, /pedir acesso/);
  });
});
