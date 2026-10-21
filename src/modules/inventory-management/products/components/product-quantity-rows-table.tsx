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
import { formatFixedDecimal } from "@/shared/lib/format";

const ROW_LABELS: { key: keyof ProductInquiryQuantityRows; label: string }[] = [
  { key: "on_hand", label: "On hand" },
  { key: "opened", label: "Opened" },
  { key: "committed", label: "Committed" },
  { key: "net_available", label: "Net available" },
];

export function ProductQuantityRowsTable({
  rows,
  unitCode,
  unit2Code,
}: {
  rows: ProductInquiryQuantityRows | null | undefined;
  unitCode?: string | null;
  unit2Code?: string | null;
}) {
  if (!rows) {
    return null;
  }
  const u1 = unitCode?.trim() || "Unit";
  const u2 = unit2Code?.trim() || "Unit 2";

  return (
    <InquirySection
      title="Quantity breakdown"
      description="Primary unit, secondary unit, and remainder"
    >
      <InquiryTableShell>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9">Measure</TableHead>
              <TableHead className="h-9 text-right">{u1}</TableHead>
              <TableHead className="h-9 text-right">{u2}</TableHead>
              <TableHead className="h-9 text-right">Remainder</TableHead>
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
                    {formatFixedDecimal(row.unit_qty, 3)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatFixedDecimal(row.unit2_qty, 3)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatFixedDecimal(row.remainder_qty, 3)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </InquiryTableShell>
    </InquirySection>
  );
}
