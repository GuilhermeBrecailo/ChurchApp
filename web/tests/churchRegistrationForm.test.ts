import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { parse } from "@vue/compiler-sfc";

const onboardingPagePath = new URL("../app/pages/onboarding/church.vue", import.meta.url);
const registerPagePath = new URL("../app/pages/register.vue", import.meta.url);

async function readVueFile(path: URL) {
  const source = await readFile(path, "utf8");
  const { descriptor, errors } = parse(source, { filename: path.pathname });
  assert.deepEqual(errors, []);
  return { source, descriptor };
}

describe("criar a igreja: uma tela, menos de 30 segundos", () => {
  it("pergunta só o nome (obrigatório), a cidade e a UF", async () => {
    const { descriptor } = await readVueFile(onboardingPagePath);
    const template = descriptor.template?.content ?? "";
    const nameField = template.match(/<v-text-field\s+v-model="form\.name"[\s\S]*?\/>/)?.[0];

    assert.match(template, /Como se chama sua igreja\?/);
    assert.ok(nameField);
    assert.match(nameField, /\brequired\b/);
    assert.match(template, /label="Cidade"/);
    assert.match(template, /label="UF"/);
    for (const removed of ["Endereço", "Número", "CEP", "Documento"]) {
      assert.doesNotMatch(template, new RegExp(`label="${removed}"`), removed);
    }
  });

  it("não pré-cria ministérios: setupMode later e lista vazia", async () => {
    const { source } = await readVueFile(onboardingPagePath);

    assert.match(source, /setupMode:\s*"later"/);
    assert.match(source, /initialDepartments:\s*\[\]/);
    assert.doesNotMatch(source, /ChurchMinistrySetup/); // componente removido
    assert.doesNotMatch(source, /createDefaultChurchSetup/);
  });

  it("depois de criar, vai para o Início com o aviso de próximos passos", async () => {
    const { source } = await readVueFile(onboardingPagePath);

    assert.match(source, /createOwnChurch\(/);
    assert.match(source, /Igreja criada! Vamos deixar tudo pronto em poucos passos\./);
    assert.match(source, /router\.replace\("\/"\)/);
  });

  it("usa só os tokens do tema (funciona no claro e no escuro)", async () => {
    const { source } = await readVueFile(onboardingPagePath);

    assert.doesNotMatch(source, /\b(text|bg|border)-(gray|purple)-\d+/);
    assert.doesNotMatch(source, /#[0-9a-f]{3,8}\b/i);
  });
});

describe("cadastro do pastor", () => {
  it("pede nome, e-mail, WhatsApp e senha com olhinho, sem confirmar senha", async () => {
    const { descriptor } = await readVueFile(registerPagePath);
    const template = descriptor.template?.content ?? "";

    assert.match(template, /label="Seu nome"/);
    assert.match(template, /label="E-mail"/);
    assert.match(template, /label="WhatsApp"/);
    assert.match(template, /<OnboardingPasswordField/);
    assert.doesNotMatch(template, /Confirmar senha/);
    assert.doesNotMatch(template, /Sou membro/);
  });

  it("leva o membro para o convite e o pastor para criar a igreja", async () => {
    const { source } = await readVueFile(registerPagePath);

    assert.match(source, /Recebeu um convite da sua igreja\?/);
    assert.match(source, /to="\/join"/);
    assert.match(source, /role !== "MEMBER"/);
    assert.match(source, /path: "\/join"/);
    assert.match(source, /"\/onboarding\/church"/);
  });

  it("deixa o gerenciador de senhas funcionar", async () => {
    const { source } = await readVueFile(registerPagePath);
    assert.doesNotMatch(source, /autocomplete="off"/);
    assert.match(source, /autocomplete="new-password"/);
  });
});
