import { describe, expect, it } from "vitest";

import {
  applyGrantedIds,
  applyPermissionToggle,
  grantedPermissionIds,
  normalizePermissionIds,
  sameIdSet,
  type PermissionMatrixRow,
} from "@/modules/users-management/permissions/matrix";
import type { PermissionMatrixResponse } from "@/modules/users-management/permissions/schemas";

const READ_ID = "11111111-1111-4111-8111-111111111111";
const UPDATE_ID = "22222222-2222-4222-8222-222222222222";
const CREATE_ID = "33333333-3333-4333-8333-333333333333";

const MATRIX: PermissionMatrixResponse = {
  modules: [
    {
      module: "sales",
      resources: [
        {
          resource: "quotation",
          actions: [
            {
              id: READ_ID,
              action: "read",
              code: "sales.quotation.read",
              granted: true,
            },
            {
              id: UPDATE_ID,
              action: "update",
              code: "sales.quotation.update",
              granted: false,
            },
            {
              id: CREATE_ID,
              action: "create",
              code: "sales.quotation.create",
              granted: false,
            },
          ],
        },
      ],
    },
    {
      module: "erp",
      resources: [
        {
          resource: "period",
          actions: [
            {
              id: "44444444-4444-4444-8444-444444444444",
              action: "lock",
              code: "erp.period.lock",
              granted: false,
            },
          ],
        },
      ],
    },
  ],
};

describe("permission matrix grants", () => {
  it("collects granted action ids", () => {
    expect(grantedPermissionIds(MATRIX)).toEqual(["11111111-1111-4111-8111-111111111111"]);
  });

  it("applies a new grant set without dropping catalog rows", () => {
    const next = applyGrantedIds(MATRIX, new Set(["22222222-2222-4222-8222-222222222222"]));
    expect(grantedPermissionIds(next)).toEqual(["22222222-2222-4222-8222-222222222222"]);
    const row: PermissionMatrixRow = {
      module: next.modules[0].module,
      resource: next.modules[0].resources[0].resource,
      actions: {
        read: next.modules[0].resources[0].actions[0],
        update: next.modules[0].resources[0].actions[1],
      },
    };
    expect(row.actions.read.granted).toBe(false);
    expect(row.actions.update.granted).toBe(true);
  });

  it("compares unordered id lists", () => {
    expect(sameIdSet(["a", "b"], ["b", "a"])).toBe(true);
    expect(sameIdSet(["a"], ["a", "b"])).toBe(false);
  });

  it("checks read when granting a non-read action on the same resource", () => {
    const ids = applyPermissionToggle(MATRIX, new Set([READ_ID]), UPDATE_ID, true);
    expect(ids.sort()).toEqual([READ_ID, UPDATE_ID].sort());
  });

  it("clears all resource actions when read is unchecked", () => {
    const ids = applyPermissionToggle(
      MATRIX,
      new Set([READ_ID, UPDATE_ID, CREATE_ID]),
      READ_ID,
      false,
    );
    expect(ids).toEqual([]);
  });

  it("does not require read for resources that have no read action", () => {
    const lockId = "44444444-4444-4444-8444-444444444444";
    const ids = applyPermissionToggle(MATRIX, new Set(), lockId, true);
    expect(ids).toEqual([lockId]);
  });

  it("normalizes update-without-read to include read", () => {
    const ids = normalizePermissionIds(MATRIX, new Set([UPDATE_ID]));
    expect(ids.sort()).toEqual([READ_ID, UPDATE_ID].sort());
  });

  it("normalizes missing read to drop other grants on that resource", () => {
    const ids = normalizePermissionIds(MATRIX, new Set([UPDATE_ID, CREATE_ID]));
    expect(ids.sort()).toEqual([READ_ID, UPDATE_ID, CREATE_ID].sort());
    const cleared = normalizePermissionIds(MATRIX, new Set());
    expect(cleared).toEqual([]);
  });
});
