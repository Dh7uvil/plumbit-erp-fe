import { describe, expect, it } from "vitest";

import {
  buildAppliedFilterItems,
  filterClearPatchFromSpecs,
  formatFilterDateRange,
  type FilterSpec,
} from "@/shared/components/data-table/applied-filter-spec";

describe("formatFilterDateRange", () => {
  it("formats a full range", () => {
    expect(formatFilterDateRange("2026-01-01", "2026-01-31")).toMatch(/2026/);
  });

  it("formats partial ranges", () => {
    expect(formatFilterDateRange("2026-01-01", undefined)).toMatch(/^From /);
    expect(formatFilterDateRange(undefined, "2026-01-31")).toMatch(/^To /);
  });
});

describe("buildAppliedFilterItems", () => {
  const specs: FilterSpec[] = [
    { type: "text", source: "search", label: "Search" },
    {
      type: "option",
      key: "status",
      label: "Status",
      options: [
        { value: "draft", label: "Draft" },
        { value: "confirmed", label: "Confirmed" },
      ],
    },
    { type: "dateRange", fromKey: "from", toKey: "to", label: "Date" },
    { type: "flag", key: "mine", label: "My open" },
    {
      type: "multi",
      key: "tags",
      parse: (value) => (value ? value.split(",") : []),
      serialize: (values) => (values.length > 0 ? values.join(",") : undefined),
      labelFor: (id) => `Tag ${id}`,
    },
  ];

  it("returns nothing when no filters apply", () => {
    expect(buildAppliedFilterItems(undefined, {}, specs)).toEqual([]);
  });

  it("builds search, option, date, flag, and multi pills", () => {
    const items = buildAppliedFilterItems(
      " acme ",
      {
        status: "confirmed",
        from: "2026-01-01",
        to: "2026-01-31",
        mine: "1",
        tags: "a,b",
      },
      specs,
    );
    expect(items.find((item) => item.id === "search")?.label).toBe("Search: acme");
    expect(items.find((item) => item.id === "option:status")?.label).toBe("Status: Confirmed");
    expect(items.find((item) => item.id === "date:from:to")?.label).toMatch(/^Date: /);
    expect(items.find((item) => item.id === "flag:mine")?.label).toBe("My open");
    expect(items.filter((item) => item.id.startsWith("multi:tags:")).map((item) => item.label)).toEqual([
      "Tag a",
      "Tag b",
    ]);
  });

  it("falls back to raw option values", () => {
    const items = buildAppliedFilterItems(undefined, { status: "unknown" }, specs);
    expect(items[0]?.label).toBe("Status: unknown");
  });

  it("clears one multi value", () => {
    const items = buildAppliedFilterItems(undefined, { tags: "a,b" }, specs);
    expect(items[0]?.removePatch).toEqual({
      filters: { tags: "b" },
      page: 1,
    });
  });
});

describe("filterClearPatchFromSpecs", () => {
  it("nulls every spec key and search", () => {
    const specs: FilterSpec[] = [
      { type: "text", source: "search", label: "Search" },
      { type: "option", key: "status", label: "Status", options: [] },
      { type: "dateRange", fromKey: "from", toKey: "to", label: "Date" },
      { type: "flag", key: "mine", label: "Mine" },
      { type: "text", source: { filterKey: "ref" }, label: "Ref" },
    ];
    expect(filterClearPatchFromSpecs(specs)).toEqual({
      search: null,
      filters: {
        status: null,
        from: null,
        to: null,
        mine: null,
        ref: null,
      },
      page: 1,
    });
  });
});
