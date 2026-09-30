"use client";

import { useMemo } from "react";
import type { FieldValues, Path, PathValue, UseFormReturn } from "react-hook-form";

import { useActiveChargeTypes } from "@/modules/erp/accounting/charge-types/queries";
import type { ChargeType } from "@/modules/erp/accounting/charge-types/schemas";
import type { GoodsReceiptCharge } from "@/modules/inventory-management/goods-receipts/schemas";
import { DecimalInput } from "@/shared/components/form/decimal-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { formatReportMoney } from "@/shared/lib/format";

export type GrnChargeFormValues = {
  charge_type_id: string;
  amount: string;
  notes: string;
};

type Props<TFieldValues extends FieldValues & { charges: GrnChargeFormValues[] }> = {
  form: UseFormReturn<TFieldValues>;
  disabled?: boolean;
};

function chargeApplies(charge: ChargeType): boolean {
  return charge.is_inventoriable && (charge.applies_to === "IMPORT" || charge.applies_to === "BOTH");
}

export function emptyGrnCharge(chargeTypeId: string): GrnChargeFormValues {
  return {
    charge_type_id: chargeTypeId,
    amount: "",
    notes: "",
  };
}

export function GrnChargesPanel<TFieldValues extends FieldValues & { charges: GrnChargeFormValues[] }>({
  form,
  disabled,
}: Props<TFieldValues>) {
  const chargeTypesQuery = useActiveChargeTypes();
  const charges = form.watch("charges" as Path<TFieldValues>) as GrnChargeFormValues[];

  const inventoriableCharges = useMemo(
    () =>
      (chargeTypesQuery.data ?? [])
        .filter(chargeApplies)
        .sort((a, b) => a.sort_order - b.sort_order),
    [chargeTypesQuery.data],
  );

  const chargeIndexByTypeId = useMemo(() => {
    const map = new Map<string, number>();
    charges.forEach((charge, index) => {
      if (charge.charge_type_id) {
        map.set(charge.charge_type_id, index);
      }
    });
    return map;
  }, [charges]);

  const setChargeField = (
    charge: ChargeType,
    field: "amount" | "notes",
    value: string,
  ) => {
    const index = chargeIndexByTypeId.get(charge.id);
    const next = [...charges];
    if (index == null) {
      next.push({ ...emptyGrnCharge(charge.id), [field]: value });
    } else {
      next[index] = { ...next[index], [field]: value };
    }
    form.setValue(
      "charges" as Path<TFieldValues>,
      next as PathValue<TFieldValues, Path<TFieldValues>>,
      { shouldDirty: true },
    );
  };

  if (chargeTypesQuery.isLoading || inventoriableCharges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div>
        <p className="text-sm font-medium">Import charges</p>
        <p className="text-muted-foreground text-xs">
          Enter inventoriable charge amounts to allocate across received lines when the goods receipt
          is posted.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {inventoriableCharges.map((charge) => {
          const index = chargeIndexByTypeId.get(charge.id);
          const amount = index != null ? (charges[index]?.amount ?? "") : "";
          const notes = index != null ? (charges[index]?.notes ?? "") : "";
          return (
            <div key={charge.id} className="flex flex-col gap-2 rounded-md border p-3">
              <p className="text-sm font-medium">{charge.name}</p>
              <DecimalInput
                kind="money"
                disabled={disabled}
                value={amount}
                onChange={(event) => setChargeField(charge, "amount", event.target.value)}
                placeholder="0.00"
              />
              <Input
                disabled={disabled}
                value={notes}
                onChange={(event) => setChargeField(charge, "notes", event.target.value)}
                placeholder="Notes (optional)"
                maxLength={500}
              />
            </div>
          );
        })}
      </div>
      <p className="text-muted-foreground text-xs">Leave amount blank to omit a charge.</p>
    </div>
  );
}

export function GrnChargesReadOnlyCard({
  charges,
  chargesTotal,
}: {
  charges: GoodsReceiptCharge[];
  chargesTotal?: string;
}) {
  const chargeTypesQuery = useActiveChargeTypes();
  const chargeNameById = useMemo(
    () => new Map((chargeTypesQuery.data ?? []).map((charge) => [charge.id, charge.name])),
    [chargeTypesQuery.data],
  );

  if (charges.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Import charges</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <table className="w-full caption-bottom text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-3 py-2 text-left font-medium">Charge</th>
              <th className="px-3 py-2 text-right font-medium">Amount</th>
              <th className="px-3 py-2 text-left font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {charges.map((charge) => (
              <tr key={charge.id} className="border-b last:border-0">
                <td className="px-3 py-2">
                  {chargeNameById.get(charge.charge_type_id) ?? charge.charge_type_id}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatReportMoney(charge.amount)}
                </td>
                <td className="px-3 py-2">{charge.notes?.trim() || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {chargesTotal ? (
          <p className="text-muted-foreground text-right tabular-nums">
            Total: {formatReportMoney(chargesTotal)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
