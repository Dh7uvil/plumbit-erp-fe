import { describe, expect, it } from "vitest";

import { can } from "@/shared/auth/permissions";
import { crudPermissions, resolveFormDialogMode } from "@/shared/auth/use-crud-permissions";

const keys = {
  read: "erp.quotation.read",
  create: "erp.quotation.create",
  update: "erp.quotation.update",
  delete: "erp.quotation.delete",
};

describe("can", () => {
  it("returns true only when the permission is granted", () => {
    expect(can("erp.quotation.read", ["erp.quotation.read", "erp.quotation.create"])).toBe(true);
    expect(can("erp.quotation.delete", ["erp.quotation.read"])).toBe(false);
    expect(can("erp.quotation.read")).toBe(false);
  });
});

describe("crudPermissions", () => {
  it("treats missing optional keys as false", () => {
    const granted = crudPermissions((permission) => permission === "identity.audit_log.read", {
      read: "identity.audit_log.read",
    });
    expect(granted).toEqual({
      canRead: true,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
    });
  });

  it("checks create, update and delete independently", () => {
    const granted = new Set(["erp.quotation.read", "erp.quotation.create"]);
    const permissions = crudPermissions((permission) => granted.has(permission), keys);
    expect(permissions.canRead).toBe(true);
    expect(permissions.canCreate).toBe(true);
    expect(permissions.canUpdate).toBe(false);
    expect(permissions.canDelete).toBe(false);
  });
});

describe("resolveFormDialogMode", () => {
  it("creates when there is no record", () => {
    expect(resolveFormDialogMode({ hasRecord: false, canCreate: true, canUpdate: true })).toEqual({
      mode: "create",
      readOnly: false,
      canSubmit: true,
    });
  });

  it("views when update is missing", () => {
    expect(resolveFormDialogMode({ hasRecord: true, canCreate: true, canUpdate: false })).toEqual({
      mode: "view",
      readOnly: true,
      canSubmit: false,
    });
  });
});
