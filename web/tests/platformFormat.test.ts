import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adminUserRoleLabel, departmentTypeLabel, formatDate } from "../app/utils/platformFormat";

describe("platformFormat", () => {
  it("traduz o tipo de ministério e usa Outro para valores desconhecidos", () => {
    assert.equal(departmentTypeLabel("WORSHIP"), "Louvor");
    assert.equal(departmentTypeLabel("MUSIC"), "Louvor");
    assert.equal(departmentTypeLabel("KIDS"), "Crianças");
    assert.equal(departmentTypeLabel("QUALQUER"), "Outro");
  });

  it("traduz o papel do usuário e trata o resto como Membro", () => {
    assert.equal(adminUserRoleLabel("PASTOR"), "Pastor");
    assert.equal(adminUserRoleLabel("SUPER_ADMIN"), "Super admin");
    assert.equal(adminUserRoleLabel("ADMIN"), "Admin");
    assert.equal(adminUserRoleLabel("MEMBER"), "Membro");
  });

  it("formata datas em dd/mm/aaaa e devolve '-' para vazio ou inválido", () => {
    assert.match(formatDate("2026-11-17T15:00:00.000Z"), /^\d{2}\/\d{2}\/2026$/);
    assert.equal(formatDate(undefined), "-");
    assert.equal(formatDate(null), "-");
    assert.equal(formatDate("não é data"), "-");
  });
});
