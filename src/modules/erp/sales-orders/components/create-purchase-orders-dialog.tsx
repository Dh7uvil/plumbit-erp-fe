"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { useCreatePurchaseOrdersFromSalesOrder } from "@/modules/erp/sales-orders/mutations";
import { useSalesOrderPurchaseOrderPlan } from "@/modules/erp/sales-orders/queries";
import type {
  PurchaseOrderFromSalesOrderRequest,
  PurchaseOrderPlanGroup,
  PurchaseOrderPlanLine,
  SalesOrder,
} from "@/modules/erp/sales-orders/schemas";
import { useAllWarehouses } from "@/modules/inventory-management/warehouses/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { formatDecimal } from "@/shared/lib/format";

type LineDraft = {
  selected: boolean;
  quantity: string;
  rate: string;
};

type GroupDraft = {
  warehouseId: string;
  expectedDeliveryDate: string;
  lines: Record<string, LineDraft>;
};

function emptyGroup(group: PurchaseOrderPlanGroup): GroupDraft {
  return {
    warehouseId: OPTIONAL_SELECT_NONE,
    expectedDeliveryDate: "",
    lines: Object.fromEntries(
      group.lines.map((line) => [
        line.sales_order_line_id,
        {
          selected: true,
          quantity: line.qty_uncovered,
          rate: line.catalog_price ?? "",
        },
      ]),
    ),
  };
}

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

export function CreatePurchaseOrdersDialog({
  salesOrder,
  open,
  onOpenChange,
}: {
  salesOrder: SalesOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const planQuery = useSalesOrderPurchaseOrderPlan(salesOrder.id, open);
  const warehousesQuery = useAllWarehouses(open);
  const createOrders = useCreatePurchaseOrdersFromSalesOrder();
  const plan = planQuery.data ?? null;
  const groups = useMemo(() => plan?.groups ?? [], [plan]);
  const unassigned = plan?.unassigned ?? [];
  const warehouses = warehousesQuery.data ?? [];
  const [drafts, setDrafts] = useState<Record<string, GroupDraft>>({});
  const [draftPlan, setDraftPlan] = useState<typeof plan>(null);

  if (plan !== draftPlan) {
    setDraftPlan(plan);
    setDrafts(
      Object.fromEntries((plan?.groups ?? []).map((group) => [group.supplier_id, emptyGroup(group)])),
    );
  }

  const payload = useMemo((): PurchaseOrderFromSalesOrderRequest | null => {
    const selectedGroups = groups
      .map((group) => {
        const draft = drafts[group.supplier_id];
        if (!draft) {
          return null;
        }
        const lines = group.lines
          .filter((line) => draft.lines[line.sales_order_line_id]?.selected)
          .map((line) => ({
            sales_order_line_id: line.sales_order_line_id,
            quantity: draft.lines[line.sales_order_line_id]?.quantity ?? line.qty_uncovered,
            rate: draft.lines[line.sales_order_line_id]?.rate.trim()
              ? draft.lines[line.sales_order_line_id].rate
              : null,
            supplier_product_id: line.supplier_product_id,
          }));
        if (lines.length === 0) {
          return null;
        }
        return {
          supplier_id: group.supplier_id,
          warehouse_id: optionalUuid(draft.warehouseId),
          expected_delivery_date: draft.expectedDeliveryDate || null,
          currency_id: group.currency_id,
          lines,
        };
      })
      .filter((group): group is NonNullable<typeof group> => Boolean(group));
    if (selectedGroups.length === 0) {
      return null;
    }
    return { groups: selectedGroups, allow_overcommit: false };
  }, [drafts, groups]);

  async function onSubmit() {
    if (!payload) {
      toast.error("Select at least one line");
      return;
    }
    try {
      const created = await createOrders.mutateAsync({ id: salesOrder.id, values: payload });
      toast.success(
        created.length === 1
          ? "1 purchase order created"
          : `${created.length} purchase orders created`,
      );
      onOpenChange(false);
      router.push(`/purchase-orders?source_sales_order_id=${salesOrder.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create purchase orders</DialogTitle>
          <DialogDescription>
            Lines are grouped by preferred supplier. Unassigned products need a catalog mapping
            before they can be purchased.
          </DialogDescription>
        </DialogHeader>
        {planQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading purchase plan…</p>
        ) : (
          <div className="flex flex-col gap-4">
            {groups.map((group) => (
              <SupplierGroupSection
                key={group.supplier_id}
                group={group}
                draft={drafts[group.supplier_id]}
                warehouses={warehouses}
                onChange={(next) =>
                  setDrafts((current) => ({ ...current, [group.supplier_id]: next }))
                }
              />
            ))}
            {unassigned.length > 0 ? (
              <details open className="rounded-md border p-3">
                <summary className="cursor-pointer text-sm font-medium">
                  No preferred supplier ({unassigned.length})
                </summary>
                <p className="text-muted-foreground mt-2 text-sm">
                  These products have no preferred supplier.{" "}
                  <Link href="/supplier-products" className="underline-offset-4 hover:underline">
                    Fix the mapping
                  </Link>
                  .
                </p>
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {unassigned.map((line) => (
                    <UnassignedLine key={line.sales_order_line_id} line={line} />
                  ))}
                </ul>
              </details>
            ) : null}
            {groups.length === 0 && unassigned.length === 0 ? (
              <p className="text-muted-foreground text-sm">All lines are already covered.</p>
            ) : null}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={createOrders.isPending || !payload}
            onClick={() => void onSubmit()}
          >
            {createOrders.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UnassignedLine({ line }: { line: PurchaseOrderPlanLine }) {
  return (
    <li>
      {line.description} · uncovered {formatDecimal(line.qty_uncovered)}
    </li>
  );
}

function SupplierGroupSection({
  group,
  draft,
  warehouses,
  onChange,
}: {
  group: PurchaseOrderPlanGroup;
  draft: GroupDraft | undefined;
  warehouses: Array<{ id: string; name: string }>;
  onChange: (draft: GroupDraft) => void;
}) {
  const current = draft ?? emptyGroup(group);
  return (
    <details open className="rounded-md border p-3">
      <summary className="cursor-pointer text-sm font-medium">{group.supplier_name}</summary>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Warehouse</Label>
          <MasterSelect
            value={current.warehouseId}
            onValueChange={(value) => onChange({ ...current, warehouseId: value })}
            placeholder="None"
            searchPlaceholder="Search warehouse…"
            options={[
              { value: OPTIONAL_SELECT_NONE, label: "None" },
              ...warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name })),
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Expected delivery</Label>
          <Input
            type="date"
            value={current.expectedDeliveryDate}
            onChange={(event) =>
              onChange({ ...current, expectedDeliveryDate: event.target.value })
            }
          />
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {group.lines.map((line) => {
          const row = current.lines[line.sales_order_line_id] ?? {
            selected: true,
            quantity: line.qty_uncovered,
            rate: line.catalog_price ?? "",
          };
          return (
            <div
              key={line.sales_order_line_id}
              className="grid grid-cols-[auto_1fr_7rem_7rem] items-center gap-2"
            >
              <Checkbox
                checked={row.selected}
                onCheckedChange={(checked) =>
                  onChange({
                    ...current,
                    lines: {
                      ...current.lines,
                      [line.sales_order_line_id]: { ...row, selected: checked === true },
                    },
                  })
                }
                aria-label={`Select ${line.description}`}
              />
              <div>
                <p className="text-sm">{line.description}</p>
                <p className="text-muted-foreground text-xs">
                  Uncovered {formatDecimal(line.qty_uncovered)}
                  {line.supplier_sku ? ` · ${line.supplier_sku}` : ""}
                </p>
              </div>
              <Input
                inputMode="decimal"
                value={row.quantity}
                disabled={!row.selected}
                onChange={(event) =>
                  onChange({
                    ...current,
                    lines: {
                      ...current.lines,
                      [line.sales_order_line_id]: { ...row, quantity: event.target.value },
                    },
                  })
                }
                aria-label={`${line.description} quantity`}
              />
              <Input
                inputMode="decimal"
                value={row.rate}
                disabled={!row.selected}
                onChange={(event) =>
                  onChange({
                    ...current,
                    lines: {
                      ...current.lines,
                      [line.sales_order_line_id]: { ...row, rate: event.target.value },
                    },
                  })
                }
                aria-label={`${line.description} rate`}
              />
            </div>
          );
        })}
      </div>
    </details>
  );
}
