import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import postcss from "postcss";

const require = createRequire(import.meta.url);
const colorMixFallback = require("../postcss/color-mix-fallback.cjs");

const run = async (css: string) => (await postcss([colorMixFallback()]).process(css, { from: undefined })).css;
const SUPPORTS = "@supports (color: color-mix(in srgb, red 50%, blue))";

describe("cor de reserva para color-mix (iPhones antigos)", () => {
  it("fundo translúcido vira o cinza neutro, e o color-mix vai para @supports", async () => {
    const css = await run(".a{background: color-mix(in srgb, var(--app-color-text) 8%, transparent);}");
    assert.match(css, /^\.a\{background: rgba\(120, 120, 128, 0\.12\);\}/);
    assert.ok(css.includes(`${SUPPORTS}{.a{background: color-mix(in srgb, var(--app-color-text) 8%, transparent);}}`));
  });

  it("contorno de foco continua visível (cor cheia)", async () => {
    const css = await run(":root{--app-focus-ring: 0 0 0 3px color-mix(in srgb, var(--app-color-accent) 20%, transparent);}");
    assert.match(css, /:root\{--app-focus-ring: 0 0 0 3px var\(--app-color-accent\);\}/);
    assert.ok(css.includes(SUPPORTS));
  });

  it("mistura com cor sólida usa a cor que pesa mais", async () => {
    assert.match(
      await run(".b{background: color-mix(in srgb, var(--app-color-accent) 5%, var(--app-color-surface));}"),
      /^\.b\{background: var\(--app-color-surface\);\}/,
    );
    assert.match(
      await run(".c{color: color-mix(in srgb, var(--app-color-accent) 85%, var(--app-color-text));}"),
      /^\.c\{color: var\(--app-color-accent\);\}/,
    );
  });

  it("borda terracota fraquinha usa o terracota claro e mantém !important", async () => {
    const css = await run(".d{border-color: color-mix(in srgb, var(--app-color-accent) 28%, transparent) !important;}");
    assert.match(css, /^\.d\{border-color: var\(--app-color-accent-tint\) !important;\}/);
  });

  it("não deixa nenhum color-mix fora do @supports", async () => {
    const css = await run(
      "@media (max-width: 600px){.e{box-shadow: 0 2px 8px color-mix(in srgb, var(--x) 5%, transparent); color: red}}",
    );
    const outside = css.replace(/@supports \(color: color-mix\(in srgb, red 50%, blue\)\)\{[^{}]*\{[^{}]*\}\}/g, "");
    assert.equal(outside.includes("color-mix("), false);
    assert.ok(outside.includes("color: red"));
  });
});
