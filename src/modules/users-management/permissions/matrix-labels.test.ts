import { describe, expect, it } from "vitest";

import { matrixActionLabel } from "@/modules/users-management/permissions/matrix";

describe("matrixActionLabel", () => {
  it("uses human labels for report and workflow verbs", () => {
    expect(matrixActionLabel("ar_ap")).toBe("AR/AP reports");
    expect(matrixActionLabel("create")).toBe("Create");
    expect(matrixActionLabel("credit_override")).toBe("Credit Override");
  });
});
