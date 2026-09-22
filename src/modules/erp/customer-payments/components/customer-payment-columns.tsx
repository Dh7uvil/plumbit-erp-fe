"use client";

import type { ReactNode } from "react";

import {
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  PAYMENT_METHOD_LABELS,
  customerPaymentDisplayNumber,
  type CustomerPayment,
} from "@/modules/erp/customer-payments/schemas";
import {
  auditActorColumns,
  auditTimestampColumns,
} from "@/shared/components/data-table/audit-columns";
import {
  actionsColumn,
  omitColumnIds,
  type DataTableColumn,
} from "@/shared/components/data-table/columns";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { formatDate, formatMoney } from "@/shared/lib/format";

export function customerPaymentColumnDefs({
  customerNameById,
  currencyCodeById,
  baseCurrencyCode,
  userNameById,
  actions,
  omit = [],
}: {
  customerNameById?: Map<string, string>;
  currencyCodeById: Map<string, string>;
  baseCurrencyCode?: string | null;
  userNameById: Map<string, string>;
  actions?: (payment: CustomerPayment) => ReactNode;
  omit?: readonly string[];
}): Array<DataTableColumn<CustomerPayment>> {
  return omitColumnIds(
    [
      {
        id: "document_number",
        header: "Number",
        sortableField: "document_number",
        className: "font-mono text-sm",
        cell: (payment) => {
          const number = customerPaymentDisplayNumber(payment);
          return <RecordLink href={`/customer-payments/${payment.id}`}>{number ?? "—"}</RecordLink>;
        },
      },
      {
        id: "customer",
        header: "Customer",
        className: "font-medium",
        cell: (payment) => (
          <RecordLink href={`/customer-payments/${payment.id}`}>
            {customerNameById?.get(payment.customer_id) ?? "—"}
          </RecordLink>
        ),
      },
      {
        id: "payment_date",
        header: "Date",
        sortableField: "payment_date",
        cell: (payment) => formatDate(payment.payment_date),
      },
      {
        id: "method",
        header: "Method",
        cell: (payment) => PAYMENT_METHOD_LABELS[payment.payment_method],
      },
      {
        id: "status",
        header: "Status",
        sortableField: "status",
        cell: (payment) => (
          <DocumentStatusBadge
            status={payment.status}
            labels={INVOICE_DOCUMENT_STATUS_LABELS}
            variants={INVOICE_DOCUMENT_STATUS_VARIANTS}
          />
        ),
      },
      {
        id: "amount",
        header: "Amount",
        sortableField: "amount_received",
        headerClassName: "text-right",
        className: "text-right tabular-nums",
        cell: (payment) => {
          const currencyCode = currencyCodeById.get(payment.currency_id);
          return (
            <>
              {formatMoney(payment.amount_received, currencyCode ?? "AED")}
              {currencyCode ? (
                <span className="text-muted-foreground ml-1 text-xs">{currencyCode}</span>
              ) : null}
            </>
          );
        },
      },
      {
        id: "base_amount",
        header: "Base amount",
        defaultVisible: false,
        headerClassName: "text-right",
        className: "text-right tabular-nums",
        cell: (payment) => formatMoney(payment.base_amount, baseCurrencyCode ?? ""),
      },
      {
        id: "is_posted",
        header: "Posted",
        defaultVisible: false,
        cell: (payment) => (payment.is_posted ? "Posted" : "Draft"),
      },
      {
        id: "currency",
        header: "Currency",
        defaultVisible: false,
        cell: (payment) => currencyCodeById.get(payment.currency_id) ?? "—",
      },
      {
        id: "exchange_rate",
        header: "Exchange rate",
        defaultVisible: false,
        className: "tabular-nums",
        cell: (payment) => payment.exchange_rate,
      },
      {
        id: "reference",
        header: "Reference",
        defaultVisible: false,
        cell: (payment) => payment.reference || "—",
      },
      {
        id: "bank_charges",
        header: "Bank charges",
        defaultVisible: false,
        headerClassName: "text-right",
        className: "text-right tabular-nums",
        cell: (payment) =>
          formatMoney(payment.bank_charges, currencyCodeById.get(payment.currency_id) ?? ""),
      },
      {
        id: "amount_unapplied",
        header: "Unapplied",
        defaultVisible: false,
        headerClassName: "text-right",
        className: "text-right tabular-nums",
        cell: (payment) =>
          formatMoney(payment.amount_unapplied, currencyCodeById.get(payment.currency_id) ?? ""),
      },
      {
        id: "notes",
        header: "Notes",
        defaultVisible: false,
        className: "max-w-xs truncate",
        cell: (payment) => payment.notes || "—",
      },
      ...auditTimestampColumns<CustomerPayment>(),
      ...auditActorColumns<CustomerPayment>(userNameById),
      ...actionsColumn<CustomerPayment>(Boolean(actions), (payment) => actions?.(payment)),
    ],
    omit,
  );
}
