import { canManageDepartmentSchedule } from "../src/application/Services/Department/DepartmentSchedulePermission";

describe("canManageDepartmentSchedule", () => {
  it("allows the titular department leader", () => {
    expect(
      canManageDepartmentSchedule({
        isChurchWideManager: false,
        isDepartmentLeader: true,
        canManageSchedule: false,
      }),
    ).toBe(true);
  });

  it("allows a delegated manager", () => {
    expect(
      canManageDepartmentSchedule({
        isChurchWideManager: false,
        isDepartmentLeader: false,
        canManageSchedule: true,
      }),
    ).toBe(true);
  });

  it("rejects a manager delegated in another department", () => {
    expect(
      canManageDepartmentSchedule({
        isChurchWideManager: false,
        isDepartmentLeader: false,
        canManageSchedule: false,
      }),
    ).toBe(false);
  });

  it("rejects a regular member without delegation", () => {
    expect(
      canManageDepartmentSchedule({
        isChurchWideManager: false,
        isDepartmentLeader: false,
      }),
    ).toBe(false);
  });
});