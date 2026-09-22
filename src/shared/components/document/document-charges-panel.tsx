"use client";

import { useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";

import { useActiveChargeTypes } from "@/modules/erp/accounting/charge-types/queries";
import type { ChargeType } from "@/modules/erp/accounting/charge-types/schemas";
import { useAllTaxes } from "@/modules/erp/accounting/taxes/queries";
import type { PurchaseInvoiceFormValues } from "@/modules/erp/purchase-invoices/schemas";
import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { DecimalInput } from "@/shared/components/form/decimal-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

type Props = {
  form: UseFormReturn<PurchaseInvoiceFormValues>;
  disabled?: boolean;
  appliesTo?: "IMPORT" | "EXPORT" | "BOTH";
};

function chargeApplies(charge: ChargeType, appliesTo: "IMPORT" | "EXPORT" | "BOTH") {
  if (appliesTo === "BOTH") {
    return charge.applies_to === "BOTH" || charge.applies_to === "IMPORT";
  }
  return charge.applies_to === appliesTo || charge.applies_to === "BOTH";
}

export function DocumentChargesPanel({ form, disabled, appliesTo = "IMPORT" }: Props) {
  const chargeTypesQuery = useActiveChargeTypes();
  const taxesQuery = useAllTaxes();
  const lines = form.watch("lines");

  const charges = useMemo(
    () =>
      (chargeTypesQuery.data ?? [])
        .filter((row) => chargeApplies(row, appliesTo))
        .sort((a, b) => a.sort_order - b.sort_order),
    [appliesTo, chargeTypesQuery.data],
  );

  const amountByChargeId = useMemo(() => {
    const map = new Map<string, string>();
    for (const line of lines) {
      if (line.line_type === "EXPENSE" && line.charge_type_id) {
        map.set(line.charge_type_id, line.rate ?? "");
      }
    }
    return map;
  }, [lines]);

  const taxByChargeId = useMemo(() => {
    const map = new Map<string, string>();
    for (const line of lines) {
      if (line.line_type === "EXPENSE" && line.charge_type_id) {
        map.set(line.charge_type_id, line.tax_id ?? OPTIONAL_SELECT_NONE);
      }
    }
    return map;
  }, [lines]);

  const setChargeAmount = (charge: ChargeType, amount: string, taxId: string) => {
    const normalized = amount.trim();
    const hasAmount = normalized !== "" && normalized !== "0" && normalized !== "0.00";
    const productLines = lines.filter(
      (line) => line.line_type !== "EXPENSE" || !line.charge_type_id,
    );
    const otherChargeLines = lines.filter(
      (line) =>
        line.line_type === "EXPENSE" && line.charge_type_id && line.charge_type_id !== charge.id,
    );
    const next = [...productLines, ...otherChargeLines];
    if (hasAmount) {
      next.push({
        line_type: "EXPENSE",
        charge_type_id: charge.id,
        description: charge.name,
        quantity: "1",
        rate: normalized,
        tax_id: taxId,
        expense_category: OPTIONAL_SELECT_NONE,
        expense_account_id: OPTIONAL_SELECT_NONE,
        product_id: OPTIONAL_SELECT_NONE,
        supplier_product_id: OPTIONAL_SELECT_NONE,
        supplier_sku: "",
        unit_id: OPTIONAL_SELECT_NONE,
        discount_type: OPTIONAL_SELECT_NONE,
        discount_value: "",
        purchase_order_line_id: "",
        goods_receipt_id: "",
        goods_receipt_line_id: "",
        grn_unit_cost: "",
      });
    }
    form.setValue("lines", next, { shouldDirty: true });
  };

  if (chargeTypesQuery.isLoading) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div>
        <p className="text-sm font-medium">Import / export charges</p>
        <p className="text-muted-foreground text-xs">
          Enter amounts per charge. Capitalized charges flow to stock via landed cost; expensed
          charges post directly to P&amp;L.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {charges.map((charge) => {
          const amount = amountByChargeId.get(charge.id) ?? "";
          const taxId =
            taxByChargeId.get(charge.id) ?? charge.default_tax_id ?? OPTIONAL_SELECT_NONE;
          return (
            <div key={charge.id} className="flex flex-col gap-2 rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">{charge.name}</p>
                <p className="text-muted-foreground text-xs">
                  {charge.is_inventoriable ? "Capitalized into stock" : "Expensed to P&amp;L"}
                </p>
              </div>
              <DecimalInput
                kind="money"
                disabled={disabled}
                value={amount}
                onChange={(event) => setChargeAmount(charge, event.target.value, taxId)}
                placeholder="0.00"
              />
              <Select
                value={taxId}
                disabled={disabled}
                onValueChange={(value) => setChargeAmount(charge, amount || "0", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tax" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={OPTIONAL_SELECT_NONE}>Default tax</SelectItem>
                  {(taxesQuery.data ?? []).map((tax) => (
                    <SelectItem key={tax.id} value={tax.id}>
                      {tax.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
      <p className="text-muted-foreground text-xs">Leave blank to omit a charge line.</p>
    </div>
  );
}
