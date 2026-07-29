import { canManageDepartmentSchedule } from "../src/application/Services/Department/DepartmentSchedulePermission";

describe("canManageDepartmentSchedule", () => {
  it("allows the titular department leader with schedule permission", () => {
    expect(
      canManageDepartmentSchedule({
        isChurchWideManager: false,
        isDepartmentLeader: true,
        hasDepartmentPermission: true,
        canManageSchedule: false,
      }),
    ).toBe(true);
  });

  it("rejects the titular department leader without schedule permission", () => {
    expect(
      canManageDepartmentSchedule({
        isChurchWideManager: false,
        isDepartmentLeader: true,
        hasDepartmentPermission: false,
        canManageSchedule: false,
      }),
    ).toBe(false);
  });

  it("rejects a non-leader with only schedule permission", () => {
    expect(
      canManageDepartmentSchedule({
        isChurchWideManager: false,
        isDepartmentLeader: false,
        hasDepartmentPermission: true,
        canManageSchedule: false,
      }),
    ).toBe(false);
  });

  it("allows a church-wide manager", () => {
    expect(
      canManageDepartmentSchedule({
        isChurchWideManager: true,
        isDepartmentLeader: false,
        hasDepartmentPermission: false,
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
