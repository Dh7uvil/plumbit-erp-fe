"use client";

import type { ReactNode } from "react";

import type { Cheque } from "@/modules/erp/accounting/cheques/schemas";
import {
  actionsColumn,
  type DataTableColumn,
} from "@/shared/components/data-table/columns";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { MoneyWithBase } from "@/shared/components/money";
import { formatDate, humanizeEnum } from "@/shared/lib/format";

export const CHEQUE_STATUS_LABELS = {
  DRAFT: "Draft",
  ISSUED: "Issued",
  DEPOSITED: "Deposited",
  CLEARED: "Cleared",
  BOUNCED: "Bounced",
  CANCELLED: "Cancelled",
} as const;

export const CHEQUE_STATUS_VARIANTS = {
  DRAFT: "warning",
  ISSUED: "info",
  DEPOSITED: "info",
  CLEARED: "success",
  BOUNCED: "destructive",
  CANCELLED: "destructive",
} as const;

export function chequeColumnDefs({
  currencyCodeById,
  baseCurrencyCode,
  actions,
}: {
  currencyCodeById: Map<string, string>;
  baseCurrencyCode?: string | null;
  actions?: (cheque: Cheque) => ReactNode;
}): Array<DataTableColumn<Cheque>> {
  return [
    {
      id: "cheque_number",
      header: "Cheque",
      className: "font-mono text-sm",
      cell: (cheque) => (
        <div>
          <RecordLink href={`/cheques/${cheque.id}`}>{cheque.cheque_number}</RecordLink>
          <div className="text-muted-foreground text-xs">{cheque.document_number}</div>
        </div>
      ),
    },
    {
      id: "party",
      header: "Party",
      cell: (cheque) => (cheque.party_type ? humanizeEnum(cheque.party_type) : "—"),
    },
    {
      id: "due_date",
      header: "Due date",
      cell: (cheque) => formatDate(cheque.due_date ?? cheque.cheque_date),
    },
    {
      id: "amount",
      header: "Amount",
      headerClassName: "text-right",
      className: "text-right",
      cell: (cheque) => (
        <MoneyWithBase
          amount={cheque.amount}
          currencyCode={currencyCodeById.get(cheque.currency_id) ?? ""}
          baseAmount={cheque.base_amount}
          baseCurrencyCode={baseCurrencyCode}
          className="text-right"
        />
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (cheque) => (
        <DocumentStatusBadge
          status={cheque.status}
            labels={CHEQUE_STATUS_LABELS}
            variants={CHEQUE_STATUS_VARIANTS}
        />
      ),
    },
    ...actionsColumn<Cheque>(Boolean(actions), (cheque) => actions?.(cheque)),
  ];
}
