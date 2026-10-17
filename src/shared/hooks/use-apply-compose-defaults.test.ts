import { describe, expect, it, vi } from "vitest";

import { applyComposeDefaultsFromMap } from "@/shared/hooks/use-apply-compose-defaults";

describe("applyComposeDefaultsFromMap", () => {
  it("skips dirty fields unless alwaysRefresh", () => {
    const setValue = vi.fn();
    const form = { setValue } as never;
    const dirtyFieldsRef = { current: new Set(["currency_id"]) };

    applyComposeDefaultsFromMap({
      form,
      defaults: { currency_id: "new", customer_trn: "123" },
      dirtyFieldsRef,
      fieldMap: {
        currency_id: { field: "currency_id" },
        customer_trn: { field: "customer_trn", alwaysRefresh: true },
      },
    });

    expect(setValue).toHaveBeenCalledTimes(1);
    expect(setValue).toHaveBeenCalledWith("customer_trn", "123");
  });
});
