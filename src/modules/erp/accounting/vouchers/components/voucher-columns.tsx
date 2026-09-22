"use client";

import type { ReactNode } from "react";

import {
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  PAYMENT_METHOD_LABELS,
  VOUCHER_TYPE_LABELS,
  voucherDisplayNumber,
  type Voucher,
  type VoucherType,
} from "@/modules/erp/accounting/vouchers/schemas";
import {
  actionsColumn,
  omitColumnIds,
  type DataTableColumn,
} from "@/shared/components/data-table/columns";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { formatDate, formatMoney } from "@/shared/lib/format";

export function voucherColumnDefs({
  currencyCodeById,
  partyNameById,
  actions,
  omit = [],
  showType = false,
}: {
  currencyCodeById: Map<string, string>;
  partyNameById?: Map<string, string>;
  actions?: (voucher: Voucher) => ReactNode;
  omit?: readonly string[];
  showType?: boolean;
}): Array<DataTableColumn<Voucher>> {
  const columns: Array<DataTableColumn<Voucher>> = [
    {
      id: "document_number",
      header: "Number",
      sortableField: "document_number",
      className: "font-mono text-sm",
      cell: (voucher) => (
        <RecordLink href={`/vouchers/${voucher.id}`}>{voucherDisplayNumber(voucher)}</RecordLink>
      ),
    },
    {
      id: "voucher_date",
      header: "Date",
      sortableField: "voucher_date",
      cell: (voucher) => formatDate(voucher.voucher_date),
    },
  ];

  if (showType) {
    columns.push({
      id: "voucher_type",
      header: "Type",
      cell: (voucher) => VOUCHER_TYPE_LABELS[voucher.voucher_type as VoucherType],
    });
  }

  columns.push(
    {
      id: "party",
      header: "Party",
      cell: (voucher) => partyNameById?.get(voucher.party_id ?? "") ?? "—",
    },
    {
      id: "payment_method",
      header: "Method",
      cell: (voucher) => PAYMENT_METHOD_LABELS[voucher.payment_method],
    },
    {
      id: "status",
      header: "Status",
      sortableField: "status",
      cell: (voucher) => (
        <DocumentStatusBadge
          status={voucher.status}
          labels={INVOICE_DOCUMENT_STATUS_LABELS}
          variants={INVOICE_DOCUMENT_STATUS_VARIANTS}
        />
      ),
    },
    {
      id: "total_amount",
      header: "Amount",
      sortableField: "total_amount",
      className: "text-right tabular-nums",
      cell: (voucher) =>
        formatMoney(voucher.total_amount, currencyCodeById.get(voucher.currency_id) ?? ""),
    },
    {
      id: "reference",
      header: "Reference",
      cell: (voucher) => voucher.reference ?? "—",
    },
  );

  return omitColumnIds(
    [...columns, ...actionsColumn(Boolean(actions), actions ?? (() => null))],
    omit,
  );
}
