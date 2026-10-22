"use client";

import {
  InquirySection,
  InquiryTableShell,
} from "@/modules/inventory-management/products/components/product-inquiry-layout";
import type { ProductInquiryQuantityRows } from "@/modules/inventory-management/products/schemas";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatPackingLabel, formatQuantity } from "@/shared/lib/format";

const ROW_LABELS: { key: keyof ProductInquiryQuantityRows; label: string }[] = [
  { key: "on_hand", label: "Qty on hand" },
  { key: "opened", label: "Qty opened" },
  { key: "committed", label: "Qty committed" },
  { key: "net_available", label: "Net avail. qty" },
];

export function ProductQuantityRowsTable({
  rows,
  unitCode,
  unit2Code,
  packingLabel,
}: {
  rows: ProductInquiryQuantityRows | null | undefined;
  unitCode?: string | null;
  unit2Code?: string | null;
  packingLabel?: string | null;
}) {
  if (!rows) {
    return null;
  }
  const u1 = unitCode?.trim() || "Unit";
  const u2 = unit2Code?.trim();
  const showUnit2 = Boolean(u2);

  return (
    <InquirySection
      title="Units & quantities"
      headerAside={
        packingLabel?.trim() ? `Per ${formatPackingLabel(packingLabel)}` : undefined
      }
      description={!packingLabel?.trim() && !showUnit2 ? "Base unit quantities" : undefined}
    >
      <InquiryTableShell>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9 w-[34%]">Measure</TableHead>
              <TableHead className="h-9 text-right">
                <span className="block text-[0.65rem] font-normal tracking-wide uppercase opacity-80">
                  Unit
                </span>
                <span>{u1}</span>
              </TableHead>
              {showUnit2 ? (
                <>
                  <TableHead className="h-9 text-right">
                    <span className="block text-[0.65rem] font-normal tracking-wide uppercase opacity-80">
                      Unit 2
                    </span>
                    <span>{u2}</span>
                  </TableHead>
                  <TableHead className="h-9 text-right">
                    <span className="block text-[0.65rem] font-normal tracking-wide uppercase opacity-80">
                      Loose unit
                    </span>
                    <span>{u1}</span>
                  </TableHead>
                </>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROW_LABELS.map(({ key, label }) => {
              const row = rows[key];
              if (!row) {
                return null;
              }
              return (
                <TableRow key={key}>
                  <TableCell className="font-medium">{label}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatQuantity(row.unit_qty)}
                  </TableCell>
                  {showUnit2 ? (
                    <>
                      <TableCell className="text-right tabular-nums">
                        {formatQuantity(row.unit2_qty)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatQuantity(row.remainder_qty)}
                      </TableCell>
                    </>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </InquiryTableShell>
    </InquirySection>
  );
}
