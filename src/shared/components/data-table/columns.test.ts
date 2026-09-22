import { describe, expect, it } from "vitest";

import {
  actionsColumn,
  columnPickerDraft,
  defaultColumnPreference,
  omitColumnIds,
  resolveTableColumns,
  type DataTableColumn,
} from "@/shared/components/data-table/columns";

type Row = { id: string };

function col(id: string, extra: Partial<DataTableColumn<Row>> = {}): DataTableColumn<Row> {
  return { id, header: id, cell: () => id, ...extra };
}

const DEFS: Array<DataTableColumn<Row>> = [
  col("document_number"),
  col("customer"),
  col("order_date"),
  col("status"),
  col("grand_total"),
  col("fulfillment_status", { defaultVisible: false }),
  ...actionsColumn(true, () => "actions"),
];

describe("resolveTableColumns", () => {
  it("uses default visible columns and keeps Actions last", () => {
    const resolved = resolveTableColumns(DEFS, null);
    expect(resolved.map((column) => column.id)).toEqual([
      "document_number",
      "customer",
      "order_date",
      "status",
      "grand_total",
      "actions",
    ]);
  });

  it("drops unknown saved ids and appends new default-visible columns", () => {
    const resolved = resolveTableColumns(DEFS, {
      visible_columns: ["document_number", "removed_field", "actions"],
      column_order: ["customer", "document_number"],
      is_default: false,
    });
    expect(resolved.map((column) => column.id)).toEqual(["document_number", "customer", "actions"]);
  });

  it("keeps the first two default columns first and visible", () => {
    const resolved = resolveTableColumns(DEFS, {
      visible_columns: ["grand_total", "document_number"],
      column_order: ["grand_total", "status", "document_number"],
      is_default: false,
    });
    expect(resolved.map((column) => column.id)).toEqual([
      "document_number",
      "customer",
      "grand_total",
      "actions",
    ]);
  });

  it("falls back to defaults when saved visible set is empty after filtering", () => {
    const resolved = resolveTableColumns(DEFS, {
      visible_columns: ["gone"],
      column_order: ["gone"],
      is_default: false,
    });
    expect(resolved.map((column) => column.id)).toEqual(
      defaultColumnPreference(DEFS).visible_columns.concat("actions"),
    );
  });

  it("omits Actions when the column is not defined", () => {
    const resolved = resolveTableColumns(DEFS.slice(0, 5), null);
    expect(resolved.some((column) => column.id === "actions")).toBe(false);
  });
});

describe("columnPickerDraft", () => {
  it("lists every customizable column including hidden extras", () => {
    const draft = columnPickerDraft(DEFS, null);
    expect(draft.map((item) => item.id)).toEqual([
      "document_number",
      "customer",
      "order_date",
      "status",
      "grand_total",
      "fulfillment_status",
    ]);
    expect(draft.find((item) => item.id === "fulfillment_status")).toMatchObject({
      visible: false,
      extra: true,
      header: "fulfillment_status",
    });
    expect(draft.find((item) => item.id === "document_number")).toMatchObject({
      visible: true,
      pinned: true,
    });
    expect(draft.find((item) => item.id === "customer")).toMatchObject({
      visible: true,
      pinned: true,
    });
    expect(draft.find((item) => item.id === "order_date")).toMatchObject({
      pinned: false,
    });
    expect(draft.some((item) => item.id === "actions")).toBe(false);
  });

  it("appends newly added columns after a saved order", () => {
    const draft = columnPickerDraft(DEFS, {
      visible_columns: ["document_number"],
      column_order: ["document_number"],
      is_default: false,
    });
    expect(draft.map((item) => item.id)).toEqual([
      "document_number",
      "customer",
      "order_date",
      "status",
      "grand_total",
      "fulfillment_status",
    ]);
    expect(draft[0]?.visible).toBe(true);
    expect(draft[1]?.id).toBe("customer");
    expect(draft[1]?.visible).toBe(true);
    expect(draft.filter((item) => item.visible).map((item) => item.id)).toEqual([
      "document_number",
      "customer",
    ]);
  });
});

describe("omitColumnIds", () => {
  it("drops parent-context columns while keeping actions", () => {
    const nested = omitColumnIds(DEFS, ["customer"]);
    expect(nested.map((column) => column.id)).toEqual([
      "document_number",
      "order_date",
      "status",
      "grand_total",
      "fulfillment_status",
      "actions",
    ]);
  });
});
