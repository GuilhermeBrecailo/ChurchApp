import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { devotionalProgress } from "../app/utils/devotionalProgress";

const chapters = [
  { id: "c3", order: 3 },
  { id: "c1", order: 1 },
  { id: "c2", order: 2 },
  { id: "c4", order: 4 },
];

describe("progresso do devocional", () => {
  it("sem progresso: não iniciado, 0%", () => {
    assert.deepEqual(devotionalProgress({ chapters, progresses: [] }), {
      started: false,
      current: null,
      total: 4,
      percent: 0,
      label: "Não iniciado",
    });
  });

  it("calcula pelo capítulo atual, na ordem dos capítulos (não fixo em 50%)", () => {
    const progress = devotionalProgress({ chapters, progresses: [{ lastChapterId: "c1" }] });
    assert.equal(progress.current, 1);
    assert.equal(progress.percent, 25);
    assert.equal(progress.label, "Capítulo 1 de 4");

    assert.equal(devotionalProgress({ chapters, progresses: [{ lastChapterId: "c3" }] }).percent, 75);
  });

  it("no último capítulo, 100%", () => {
    const progress = devotionalProgress({ chapters, progresses: [{ lastChapterId: "c4" }] });
    assert.equal(progress.percent, 100);
    assert.equal(progress.label, "Último capítulo");
  });

  it("lista sem capítulos (só a contagem): começou, mas sem porcentagem inventada", () => {
    const progress = devotionalProgress({ _count: { chapters: 5 }, progresses: [{ lastChapterId: "x" }] });
    assert.equal(progress.started, true);
    assert.equal(progress.percent, null);
    assert.equal(progress.total, 5);
    assert.equal(progress.label, "Em andamento");
  });
});
