"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { VoucherAllocationHistoryPanel } from "@/modules/erp/accounting/vouchers/components/voucher-allocation-history-panel";
import { VoucherForm } from "@/modules/erp/accounting/vouchers/components/voucher-form";
import { useVoucherWorkflow } from "@/modules/erp/accounting/vouchers/hooks/use-voucher-workflow";
import { voucherPermissions } from "@/modules/erp/accounting/vouchers/permissions";
import { useVoucher } from "@/modules/erp/accounting/vouchers/queries";
import {
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  PAYMENT_METHOD_LABELS,
  VOUCHER_TYPE_LABELS,
  isContraVoucher,
  voucherDisplayNumber,
  vouchersListHref,
  type Voucher,
} from "@/modules/erp/accounting/vouchers/schemas";
import { VOUCHER_ACTION_REGISTRY } from "@/modules/erp/accounting/vouchers/workflow";
import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { AppliedCommercialTerms } from "@/shared/components/document/applied-commercial-terms";
import { DocumentLedgerCard } from "@/shared/components/document/document-ledger-card";
import { DocumentRecordShell } from "@/shared/components/document/document-record-shell";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { DocumentWorkflowButtons } from "@/shared/components/document/document-workflow-buttons";
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatMoney } from "@/shared/lib/format";

export function VoucherDetailScreen({
  voucherId,
  mode,
}: {
  voucherId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(voucherPermissions);
  const voucherQuery = useVoucher(voucherId);
  const voucher = voucherQuery.data;
  const isDraft = voucher?.status === "DRAFT";
  const isEdit = mode === "edit";
  const viewHref = `/vouchers/${voucherId}`;
  const listHref = voucher ? vouchersListHref(voucher.voucher_type) : "/vouchers";
  const canEditDraft = Boolean(isDraft && canUpdate);

  useEffect(() => {
    if (isEdit && voucher && voucher.status !== "DRAFT") {
      router.replace(viewHref);
    }
  }, [isEdit, voucher, router, viewHref]);

  if (voucherQuery.isLoading || voucherQuery.isError || !voucher) {
    return (
      <DocumentRecordShell
        isLoading={voucherQuery.isLoading}
        isError={voucherQuery.isError || !voucher}
        error={voucherQuery.error}
        notFoundMessage="Voucher not found"
        onRetry={() => voucherQuery.refetch()}
        backHref={listHref}
        backLabel="Back to vouchers"
        title="Voucher"
        listHref={listHref}
        viewHref={viewHref}
        canUpdate={false}
        mode={mode}
        formTitle="Voucher"
      >
        {null}
      </DocumentRecordShell>
    );
  }

  return (
    <VoucherDetailLoaded
      voucher={voucher}
      mode={mode}
      canEditDraft={canEditDraft}
      viewHref={viewHref}
      listHref={listHref}
    />
  );
}

function VoucherDetailLoaded({
  voucher,
  mode,
  canEditDraft,
  viewHref,
  listHref,
}: {
  voucher: Voucher;
  mode: RecordPageMode;
  canEditDraft: boolean;
  viewHref: string;
  listHref: string;
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const number = voucherDisplayNumber(voucher);
  const onAction = useVoucherWorkflow(voucher);
  const [writeError, setWriteError] = useState<unknown>(null);
  const currenciesQuery = useAllCurrencies();
  const accountsQuery = useAllAccounts({ is_group: false });
  const currencyCode =
    currenciesQuery.data?.find((currency) => currency.id === voucher.currency_id)?.code ?? "";
  const accountsById = new Map((accountsQuery.data ?? []).map((account) => [account.id, account]));

  return (
    <DocumentRecordShell
      isLoading={false}
      isError={false}
      notFoundMessage="Voucher not found"
      onRetry={() => undefined}
      backHref={listHref}
      backLabel="Back to vouchers"
      title={number}
      listHref={listHref}
      viewHref={viewHref}
      editHref={canEditDraft ? `${viewHref}/edit` : undefined}
      canUpdate={canEditDraft}
      mode={mode}
      badges={
        <>
          <DocumentStatusBadge
            status={voucher.status}
            labels={INVOICE_DOCUMENT_STATUS_LABELS}
            variants={INVOICE_DOCUMENT_STATUS_VARIANTS}
          />
          <span className="text-muted-foreground text-sm">
            {VOUCHER_TYPE_LABELS[voucher.voucher_type]}
          </span>
        </>
      }
      workflow={
        <DocumentWorkflowButtons
          availableActions={voucher.available_actions}
          registry={VOUCHER_ACTION_REGISTRY}
          documentKind="voucher"
          documentLabel={number}
          extra={<StockWriteAlert error={writeError} />}
          onError={(error) => {
            if (isStockWriteAlertError(error)) {
              setWriteError(error);
              return true;
            }
            return false;
          }}
          onAction={async (action, extras) => {
            setWriteError(null);
            await onAction(action, extras);
          }}
        />
      }
      banner={
        <div className="flex flex-col gap-2">
          <AppliedCommercialTerms
            currencyId={voucher.currency_id}
            exchangeRate={voucher.exchange_rate}
            taxTreatmentLabel=""
            baseAmount={voucher.base_amount}
          />
          <p className="text-muted-foreground text-sm">
            {PAYMENT_METHOD_LABELS[voucher.payment_method]}
            {voucher.reference ? ` · ${voucher.reference}` : ""}
            {" · Unapplied "}
            {formatMoney(voucher.amount_unapplied, currencyCode)}
          </p>
        </div>
      }
      formTitle={isEdit ? "Edit voucher" : "Voucher"}
      panels={
        <>
          {!isEdit && !isContraVoucher(voucher.voucher_type) && voucher.lines.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Counter lines</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {voucher.lines.map((line) => {
                      const account = accountsById.get(line.account_id);
                      return (
                        <TableRow key={line.id}>
                          <TableCell>
                            {account ? `${account.code} — ${account.name}` : line.account_id}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMoney(line.amount, currencyCode)}
                          </TableCell>
                          <TableCell>{line.description ?? "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : null}
          <VoucherAllocationHistoryPanel voucher={voucher} currencyCode={currencyCode} />
          <DocumentLedgerCard
            journalEntryId={voucher.journal_entry_id}
            reversalJournalEntryId={voucher.reversal_journal_entry_id}
          />
        </>
      }
    >
      {isEdit ? (
        <VoucherForm
          voucher={voucher}
          voucherType={
            isContraVoucher(voucher.voucher_type) ? "CASH_RECEIPT" : voucher.voucher_type
          }
          onSuccess={() => router.push(viewHref)}
        />
      ) : (
        <VoucherForm
          voucher={voucher}
          voucherType={
            isContraVoucher(voucher.voucher_type) ? "CASH_RECEIPT" : voucher.voucher_type
          }
          disabled
        />
      )}
    </DocumentRecordShell>
  );
}
