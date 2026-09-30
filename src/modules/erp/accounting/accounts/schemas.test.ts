import { describe, expect, it } from "vitest";

import { composeAccountCode, splitAccountCode } from "@/modules/erp/accounting/accounts/schemas";

describe("splitAccountCode", () => {
  it("splits a sub-account from its parent main code", () => {
    expect(splitAccountCode("228054", "228")).toEqual({
      subAccountNumber: "054",
      manualCode: false,
    });
  });

  it("marks manual codes when no parent prefix matches", () => {
    expect(splitAccountCode("228054", "300")).toEqual({
      subAccountNumber: "",
      manualCode: true,
    });
  });

  it("treats missing parent code as manual", () => {
    expect(splitAccountCode("228054", null)).toEqual({
      subAccountNumber: "",
      manualCode: true,
    });
  });
});

describe("composeAccountCode", () => {
  it("joins main and sub segments without extra separators", () => {
    expect(composeAccountCode("228", "054")).toBe("228054");
  });

  it("trims whitespace from the sub segment", () => {
    expect(composeAccountCode("228", " 054 ")).toBe("228054");
  });
});
