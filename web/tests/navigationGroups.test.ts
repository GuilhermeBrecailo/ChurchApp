import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { groupNavigationItems } from "../app/utils/navigationGroups";
import type { RoleNavigationItem } from "../app/utils/roleNavigation";

const nav = (key: string, label = key): RoleNavigationItem =>
  ({ key, label, title: label, route: `/${key}`, matchPrefixes: [`/${key}`], icon: "home" }) as unknown as RoleNavigationItem;

describe("agrupamento da navegação", () => {
  it("separa os atalhos por assunto e remove grupos vazios", () => {
    const groups = groupNavigationItems([nav("profile"), nav("scale"), nav("prayer")]);

    assert.deepEqual(
      groups.map((group) => [group.key, group.items.map((item) => item.key)]),
      [
        ["routine", ["scale"]],
        ["content", ["prayer"]],
        ["account", ["profile"]],
      ],
    );
  });

  it("manda atalhos desconhecidos para 'Outros atalhos'", () => {
    const groups = groupNavigationItems([nav("novidade")]);

    assert.equal(groups.length, 1);
    assert.equal(groups[0]?.key, "other");
  });
});
