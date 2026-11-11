import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { groupManagementItems, MANAGEMENT_GROUPS } from "../app/utils/navigationGroups";
import type { ManagementItem } from "../app/utils/roleNavigation";

const entry = (key: string, group: ManagementItem["group"]): ManagementItem => ({
  key,
  group,
  label: key,
  title: key,
  description: "",
  route: `/${key}`,
  icon: "people",
});

describe("grupos da Gestão", () => {
  it("mantém a ordem dos grupos e dos itens, e tira grupos vazios", () => {
    const groups = groupManagementItems([
      entry("reports", "church"),
      entry("people", "people"),
      entry("care", "people"),
      entry("settings", "church"),
    ]);

    assert.deepEqual(
      groups.map((group) => group.label),
      ["Pessoas e cuidado", "Igreja"],
    );
    assert.deepEqual(
      groups.map((group) => group.items.map((item) => item.key)),
      [["people", "care"], ["reports", "settings"]],
    );
  });

  it("sem itens não há grupos", () => {
    assert.deepEqual(groupManagementItems([]), []);
  });

  it("grupos têm chaves únicas", () => {
    assert.equal(new Set(MANAGEMENT_GROUPS.map((group) => group.key)).size, MANAGEMENT_GROUPS.length);
  });
});
