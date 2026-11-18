import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

/**
 * No Vuetify 4 o slot `#item` (v-select, v-autocomplete, v-combobox) entrega o
 * objeto original em `item`; o item interno, que tinha `.raw`, passou para
 * `internalItem`. Código escrito para o Vuetify 3 (`item.raw.subtitle`) quebra
 * a renderização do menu inteiro: a lista de pessoas de "Adicionar pessoas ao
 * ministério" deixou de abrir por isso.
 */

const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "app");

function vueFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return vueFiles(path);
    return path.endsWith(".vue") ? [path] : [];
  });
}

describe("slots do Vuetify 4", () => {
  it("nenhum componente lê `item.raw` (formato do Vuetify 3)", () => {
    const offenders = vueFiles(APP_DIR).flatMap((file) =>
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .flatMap((line, index) =>
          /\bitem\.raw\b/.test(line) ? [`${relative(APP_DIR, file)}:${index + 1}  ${line.trim()}`] : [],
        ),
    );

    assert.deepEqual(
      offenders,
      [],
      "Use `item` (o objeto original) ou `internalItem.raw` — `item.raw` não existe no Vuetify 4.",
    );
  });
});
