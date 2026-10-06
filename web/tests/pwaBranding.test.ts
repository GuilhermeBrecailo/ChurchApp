import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

describe("marca do PWA", () => {
  it("usa ChurchApp no nome completo e curto do manifesto", async () => {
    const content = await readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8");
    const manifest = JSON.parse(content) as { name?: string; short_name?: string };

    assert.equal(manifest.name, "ChurchApp");
    assert.equal(manifest.short_name, "ChurchApp");
  });

  it("usa ChurchApp como título padrão sem impedir título enviado no payload push", async () => {
    const serviceWorker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");

    assert.match(serviceWorker, /title:\s*"ChurchApp"/);
    assert.match(
      serviceWorker,
      /payload\s*=\s*\{\s*\.\.\.payload,\s*\.\.\.event\.data\.json\(\),\s*\}/,
    );
  });
});
