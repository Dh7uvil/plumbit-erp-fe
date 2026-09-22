"use client";

import { isZeroDecimal } from "@/shared/lib/format";
import {
  OPEN_ITEM_TYPE_LABELS,
  type OpenItemRow,
  type OpenItemType,
  type PaymentAllocationInput,
} from "@/shared/components/document/schemas";
import { DecimalInput } from "@/shared/components/form/decimal-input";
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
    if (!value.trim()) {
      continue;
    }
    total += toScaled(value);
  }
  return fromScaled(total);
}

export const SUPPLIER_PAYMENT_ALLOCATE_TYPES = new Set<OpenItemType>([
  "PURCHASE_INVOICE",
  "OPENING_AP",
  "DEBIT_NOTE",
]);
export const CUSTOMER_PAYMENT_ALLOCATE_TYPES = new Set<OpenItemType>([
  "SALES_INVOICE",
  "OPENING_AR",
  "CREDIT_NOTE",
]);

export const SUPPLIER_NOTE_ALLOCATE_TYPES = new Set<OpenItemType>(["DEBIT_NOTE"]);

export function isNoteOpenItemType(type: OpenItemType): boolean {
  return type === "CREDIT_NOTE" || type === "DEBIT_NOTE";
}

export function sumCashAllocationAmounts(
  items: readonly OpenItemRow[],
  values: Record<string, string>,
): string {
  const cashItems = new Set(
    items
      .filter((item) => !isNoteOpenItemType(item.item_type))
      .map((item) => item.document_id),
  );
  return sumMoneyStrings(
    Object.entries(values)
      .filter(([documentId]) => cashItems.has(documentId))
      .map(([, amount]) => amount),
  );
}

export function filterOpenItemsForPaymentAllocation(
  items: readonly OpenItemRow[],
  allowed: ReadonlySet<OpenItemType>,
  excludeDocumentId?: string | null,
): OpenItemRow[] {
  return items.filter(
    (item) => allowed.has(item.item_type) && item.document_id !== excludeDocumentId,
  );
}

export function paymentAllocationsPayload(
  items: readonly OpenItemRow[],
  values: Record<string, string>,
): PaymentAllocationInput[] {
  return items
    .map((item) => {
      const amount = (values[item.document_id] ?? "").trim();
      if (isZeroDecimal(amount)) {
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
    if (match && !isZeroDecimal(match.balance)) {
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
  const allocated = sumCashAllocationAmounts(items, values);
  const noteApplied = sumMoneyStrings(
    items
      .filter((item) => isNoteOpenItemType(item.item_type))
      .map((item) => values[item.document_id] ?? ""),
  );
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
                  {formatMoney(
                    isNoteOpenItemType(item.item_type) ? `-${item.balance}` : item.balance,
                    currencyCode,
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DecimalInput
                    kind="money"
                    className="ml-auto h-8 min-w-32 w-32 text-right"
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
          <dt className="text-muted-foreground">Cash allocated</dt>
          <dd className="tabular-nums">{formatMoney(allocated, currencyCode)}</dd>
        </div>
        {noteApplied !== "0" ? (
          <div>
            <dt className="text-muted-foreground">Credits / debits</dt>
            <dd className="tabular-nums">{formatMoney(noteApplied, currencyCode)}</dd>
          </div>
        ) : null}
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
