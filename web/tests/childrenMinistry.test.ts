import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterActiveChildrenByGroup,
  getChildAttendanceLabel,
  getChildAttendanceSummary,
  isChildAttendanceAnswer,
} from "../app/utils/childrenMinistry";

describe("lógica de chamada do Ministério Infantil", () => {
  it("mantém pendente como não marcada, distinta de ausência", () => {
    assert.equal(getChildAttendanceLabel("PENDING"), "Não marcada");
    assert.equal(getChildAttendanceLabel("ABSENT"), "Ausente");
    assert.deepEqual(
      getChildAttendanceSummary([
        { status: "PRESENT" },
        { status: "ABSENT" },
        { status: "PENDING" },
      ]),
      { present: 1, absent: 1, pending: 1 },
    );
  });

  it("filtra apenas crianças ativas e respeita o grupo escolhido", () => {
    const children = [
      { id: "1", groupName: "Pequenos", isActive: true },
      { id: "2", groupName: "Maiores", isActive: true },
      { id: "3", groupName: "Pequenos", isActive: false },
    ];

    assert.deepEqual(
      filterActiveChildrenByGroup(children, "Pequenos").map(({ id }) => id),
      ["1"],
    );
    assert.deepEqual(
      filterActiveChildrenByGroup(children).map(({ id }) => id),
      ["1", "2"],
    );
  });

  it("aceita somente presente e ausente como respostas gravadas", () => {
    assert.equal(isChildAttendanceAnswer("PRESENT"), true);
    assert.equal(isChildAttendanceAnswer("ABSENT"), true);
    assert.equal(isChildAttendanceAnswer("PENDING"), false);
    assert.equal(isChildAttendanceAnswer("UNKNOWN"), false);
  });
});
