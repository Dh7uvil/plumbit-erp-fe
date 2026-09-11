import { describe, expect, it } from "vitest";

import {
  applyGrantedIds,
  grantedPermissionIds,
  sameIdSet,
  type PermissionMatrixRow,
} from "@/modules/users-management/permissions/matrix";
import type { PermissionMatrixResponse } from "@/modules/users-management/permissions/schemas";

const MATRIX: PermissionMatrixResponse = {
  modules: [
    {
      module: "sales",
      resources: [
        {
          resource: "quotation",
          actions: [
            {
              id: "11111111-1111-4111-8111-111111111111",
              action: "read",
              code: "sales.quotation.read",
              granted: true,
            },
            {
              id: "22222222-2222-4222-8222-222222222222",
              action: "update",
              code: "sales.quotation.update",
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
});
