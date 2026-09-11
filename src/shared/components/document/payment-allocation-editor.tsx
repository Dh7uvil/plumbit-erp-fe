"use client";

import { isPositiveDecimal } from "@/shared/components/document/conversion-line-picker";
import {
  OPEN_ITEM_TYPE_LABELS,
  type OpenItemRow,
  type PaymentAllocationInput,
} from "@/shared/components/document/schemas";
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { documentDetailHref } from "@/shared/components/document/document-links";
import { formatDate, formatMoney } from "@/shared/lib/format";
import Link from "next/link";

const SCALE = 4;
const ZERO = BigInt(0);
const FACTOR = BigInt(10) ** BigInt(SCALE);

function toScaled(value: string): bigint {
  const trimmed = value.trim() || "0";
  const negative = trimmed.startsWith("-");
  const unsigned = trimmed.replace(/^[+-]/, "") || "0";
  const [wholeRaw = "0", fractionRaw = ""] = unsigned.split(".");
  if (!/^\d+$/.test(wholeRaw) || (fractionRaw.length > 0 && !/^\d+$/.test(fractionRaw))) {
    return ZERO;
  }
  const whole = BigInt(wholeRaw.replace(/^0+(?=\d)/, "") || "0");
  const fraction = BigInt((fractionRaw + "0".repeat(SCALE)).slice(0, SCALE) || "0");
  const scaled = whole * FACTOR + fraction;
  return negative ? -scaled : scaled;
}

function fromScaled(value: bigint): string {
  const negative = value < ZERO;
  const abs = negative ? -value : value;
  const whole = abs / FACTOR;
  const fraction = (abs % FACTOR).toString().padStart(SCALE, "0").replace(/0+$/, "");
  const decimals = fraction ? `.${fraction}` : "";
  return `${negative ? "-" : ""}${whole}${decimals}`;
}

export function sumMoneyStrings(values: readonly string[]): string {
  let total = ZERO;
  for (const value of values) {
    if (isPositiveDecimal(value) || /^(?:0*(?:\.\d+)?)$/.test(value.trim())) {
      total += toScaled(value);
    }
  }
  return fromScaled(total);
}

export function paymentAllocationsPayload(
  items: readonly OpenItemRow[],
  values: Record<string, string>,
): PaymentAllocationInput[] {
  return items
    .map((item) => {
      const amount = (values[item.document_id] ?? "").trim();
      if (!isPositiveDecimal(amount)) {
        return null;
      }
      return {
        item_type: item.item_type,
        item_id: item.document_id,
        amount,
      };
    })
    .filter((row): row is PaymentAllocationInput => row !== null);
}

export function defaultAllocationAmounts(
  items: readonly OpenItemRow[],
  preferItemId?: string | null,
): Record<string, string> {
  if (preferItemId) {
    const match = items.find((item) => item.document_id === preferItemId);
    if (match && isPositiveDecimal(match.balance)) {
      return { [match.document_id]: match.balance };
    }
  }
  return {};
}

export function PaymentAllocationEditor({
  items,
  values,
  onChange,
  currencyCode,
  received,
  bankCharges,
  unapplied,
  disabled = false,
  emptyMessage = "No open items for this party.",
}: {
  items: readonly OpenItemRow[];
  values: Record<string, string>;
  onChange: (itemId: string, amount: string) => void;
  currencyCode: string;
  received: string;
  bankCharges: string;
  unapplied?: string | null;
  disabled?: boolean;
  emptyMessage?: string;
}) {
  const allocated = sumMoneyStrings(Object.values(values));
  const leftover =
    unapplied != null && unapplied !== ""
      ? unapplied
      : fromScaled(toScaled(received || "0") - toScaled(allocated));

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Original</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="text-right">Apply</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const href = documentDetailHref(item.item_type, item.document_id);
            return (
              <TableRow key={`${item.item_type}-${item.document_id}`}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">
                      {OPEN_ITEM_TYPE_LABELS[item.item_type]}
                      {item.is_debit ? "" : " · credit"}
                    </span>
                    {href ? (
                      <Link href={href} className="underline-offset-4 hover:underline">
                        {item.document_number || "—"}
                      </Link>
                    ) : (
                      <span>{item.document_number || "—"}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {formatDate(item.document_date)}
                  {item.due_date ? (
                    <span className="text-muted-foreground block text-xs">
                      Due {formatDate(item.due_date)}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(item.original_amount, currencyCode)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(item.balance, currencyCode)}
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    className="ml-auto h-8 w-28 text-right"
                    inputMode="decimal"
                    disabled={disabled}
                    value={values[item.document_id] ?? ""}
                    onChange={(event) => onChange(item.document_id, event.target.value)}
                    aria-label={`Apply to ${item.document_number}`}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <dl className="grid gap-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Received</dt>
          <dd className="tabular-nums">{formatMoney(received || "0", currencyCode)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Allocated</dt>
          <dd className="tabular-nums">{formatMoney(allocated, currencyCode)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Unapplied</dt>
          <dd className="tabular-nums">{formatMoney(leftover, currencyCode)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Bank charges</dt>
          <dd className="tabular-nums">{formatMoney(bankCharges || "0", currencyCode)}</dd>
        </div>
      </dl>
    </div>
  );
}
