import assert from "node:assert/strict";
import test from "node:test";
import { getVisibleDepartments } from "../app/utils/departmentVisibility";

const departments = [
  { id: "louvor", isMember: true },
  { id: "diaconato", isMember: false },
  { id: "infantil" },
] as never[];

test("mostra somente os ministérios do usuário quando ele não é gestor da igreja", () => {
  assert.deepEqual(
    getVisibleDepartments(departments, false).map((department) => department.id),
    ["louvor"],
  );
});

test("mantém todos os ministérios para gestores da igreja", () => {
  assert.deepEqual(
    getVisibleDepartments(departments, true).map((department) => department.id),
    ["louvor", "diaconato", "infantil"],
  );
});
