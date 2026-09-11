"use client";

import { useMemo } from "react";

import type { ConversionLineInput } from "@/shared/components/document/schemas";
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatDecimal } from "@/shared/lib/format";

const POSITIVE_DECIMAL = /^(?:0*[1-9]\d*(?:\.\d+)?|0+\.\d*[1-9]\d*)$/;

export type ConversionSourceLine = {
  id: string;
  line_number: number;
  description: string;
  quantity: string;
  qty_converted: string;
  qty_remaining: string;
};

export function remainingConversionQty(line: {
  quantity: string;
  qty_converted?: string | null;
  qty_remaining?: string | null;
}): string {
  if (line.qty_remaining != null && line.qty_remaining !== "") {
    return line.qty_remaining;
  }
  return line.quantity;
}

export function isPositiveDecimal(value: string): boolean {
  return POSITIVE_DECIMAL.test(value.trim());
}

export function conversionLinesPayload(
  values: Record<string, string>,
): ConversionLineInput[] | undefined {
  const lines = Object.entries(values)
    .filter(([, quantity]) => isPositiveDecimal(quantity))
    .map(([source_line_id, quantity]) => ({ source_line_id, quantity: quantity.trim() }));
  return lines.length > 0 ? lines : undefined;
}

export function isFullRemainingConversion(
  lines: ConversionSourceLine[],
  values: Record<string, string>,
): boolean {
  return lines.every((line) => {
    const selected = (values[line.id] ?? "").trim();
    if (!isPositiveDecimal(line.qty_remaining)) {
      return selected === "";
    }
    return selected === line.qty_remaining;
  });
}

export function defaultConversionQuantities(lines: ConversionSourceLine[]): Record<string, string> {
  return Object.fromEntries(
    lines.map((line) => [line.id, isPositiveDecimal(line.qty_remaining) ? line.qty_remaining : ""]),
  );
}

export function ConversionLinePicker({
  lines,
  values,
  onChange,
  convertedLabel = "Already converted",
}: {
  lines: ConversionSourceLine[];
  values: Record<string, string>;
  onChange: (lineId: string, quantity: string) => void;
  convertedLabel?: string;
}) {
  const hasRemaining = useMemo(
    () => lines.some((line) => isPositiveDecimal(line.qty_remaining)),
    [lines],
  );

  if (lines.length === 0) {
    return <p className="text-muted-foreground text-sm">This document has no lines to convert.</p>;
  }

  if (!hasRemaining) {
    return (
      <p className="text-muted-foreground text-sm">No remaining quantity is available to convert.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Line</TableHead>
          <TableHead className="text-right">Ordered</TableHead>
          <TableHead className="text-right">{convertedLabel}</TableHead>
          <TableHead className="text-right">Remaining</TableHead>
          <TableHead className="text-right">Convert qty</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((line) => {
          const remaining = isPositiveDecimal(line.qty_remaining);
          return (
            <TableRow key={line.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs">Line {line.line_number}</span>
                  <span>{line.description || "—"}</span>
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatDecimal(line.quantity)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatDecimal(line.qty_converted)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatDecimal(line.qty_remaining)}
              </TableCell>
              <TableCell className="text-right">
                <Input
                  id={`convert-qty-${line.id}`}
                  aria-label={`Line ${line.line_number} quantity to convert`}
                  inputMode="decimal"
                  className="ml-auto w-24 text-right"
                  value={values[line.id] ?? ""}
                  disabled={!remaining}
                  onChange={(event) => onChange(line.id, event.target.value)}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
