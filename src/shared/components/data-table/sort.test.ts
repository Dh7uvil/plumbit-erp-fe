import { describe, expect, it } from "vitest";

import { toggleSort } from "@/shared/components/data-table/sort";

describe("toggleSort", () => {
  it("starts a new field at ascending", () => {
    expect(toggleSort(undefined, undefined, "name")).toEqual({
      sort_by: "name",
      sort_order: "asc",
    });
    expect(toggleSort("email", "desc", "name")).toEqual({
      sort_by: "name",
      sort_order: "asc",
    });
  });

  it("cycles the active field from asc to desc to unsorted", () => {
    expect(toggleSort("name", "asc", "name")).toEqual({
      sort_by: "name",
      sort_order: "desc",
    });
    expect(toggleSort("name", "desc", "name")).toEqual({
      sort_by: null,
      sort_order: null,
    });
  });
});
