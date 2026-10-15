import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { parse } from "@vue/compiler-sfc";
import postcss from "postcss";

const componentPath = new URL("../app/components/Scale/SongPickerPanel.vue", import.meta.url);
const dialogPath = new URL("../app/components/Scale/FormDialog.vue", import.meta.url);

async function readComponent() {
  const source = await readFile(componentPath, "utf8");
  const { descriptor, errors } = parse(source, { filename: componentPath.pathname });
  assert.deepEqual(errors, []);
  return descriptor;
}

async function readDialog() {
  const source = await readFile(dialogPath, "utf8");
  const { descriptor, errors } = parse(source, { filename: dialogPath.pathname });
  assert.deepEqual(errors, []);
  return descriptor;
}

function countElements(node: any, tag: string): number {
  if (!node || typeof node !== "object") return 0;

  const ownMatch = node.type === 1 && node.tag === tag ? 1 : 0;
  const children = Array.isArray(node.children)
    ? node.children.reduce((total: number, child: any) => total + countElements(child, tag), 0)
    : 0;

  return ownMatch + children;
}

function hasAttributeValue(node: any, name: string, value: string): boolean {
  if (!node || typeof node !== "object") return false;

  const ownMatch = node.type === 1 && node.props?.some(
    (prop: any) => prop.type === 6 && prop.name === name && prop.value?.content === value,
  );
  const children = Array.isArray(node.children)
    ? node.children.some((child: any) => hasAttributeValue(child, name, value))
    : false;

  return Boolean(ownMatch || children);
}

describe("layout do seletor de músicas da escala", () => {
  it("deixa o título e o botão de voltar no cabeçalho único do diálogo", async () => {
    const panel = await readComponent();

    assert.equal(countElements(panel.template?.ast, "h2"), 0);
    assert.equal(hasAttributeValue(panel.template?.ast, "aria-label", "Voltar para a escala"), false);
  });

  it("mantém a lista como a única área rolável do painel", async () => {
    const panel = await readComponent();
    const dialog = await readDialog();
    const stylesheet = postcss.parse(panel.styles[0]?.content ?? "");
    const scrollableBinding = dialog.template?.ast.children
      .find((node: any) => node.type === 1 && node.tag === "UtilsResponsiveOverlay")
      ?.props.find((prop: any) => prop.type === 7 && prop.name === "bind" && prop.arg?.content === "scrollable");
    const listRule = stylesheet.nodes.find(
      (node): node is postcss.Rule => node.type === "rule" && node.selector === ".song-picker-list",
    );
    const declarations = new Map(
      listRule?.nodes
        .filter((node): node is postcss.Declaration => node.type === "decl")
        .map(({ prop, value }) => [prop, value]),
    );

    assert.equal(declarations.get("overflow-y"), "auto");
    assert.equal(declarations.get("min-height"), "0");
    assert.equal(declarations.has("max-height"), false);
    assert.equal(scrollableBinding?.exp?.content, "!isSongPickerOpen");
  });
});
