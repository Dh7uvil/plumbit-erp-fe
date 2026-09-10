import {
  AccountStatementSchema,
  ExportEvidenceExceptionSchema,
  GeneralLedgerSchema,
  InvoicedNotDispatchedSchema,
  TrialBalanceSchema,
  type AccountStatement,
  type AccountStatementParams,
  type ExportEvidenceException,
  type ExportEvidenceExceptionParams,
  type GeneralLedger,
  type GeneralLedgerParams,
  type InvoicedNotDispatched,
  type TrialBalance,
  type TrialBalanceParams,
} from "@/modules/erp/accounting/reports/schemas";
import { apiClient } from "@/shared/api/client";

export const reportsApi = {
  trialBalance: async (params: TrialBalanceParams): Promise<TrialBalance> =>
    TrialBalanceSchema.parse(
      await apiClient.get("/reports/trial-balance", {
        params: {
          from: params.from,
          to: params.to,
          branch_id: params.branch_id,
          include_zero: params.include_zero,
        },
      }),
    ),
  generalLedger: async (params: GeneralLedgerParams): Promise<GeneralLedger> =>
    GeneralLedgerSchema.parse(
      await apiClient.get("/reports/general-ledger", {
        params: {
          account_id: params.account_id,
          from: params.from,
          to: params.to,
          party_id: params.party_id,
          branch_id: params.branch_id,
        },
      }),
    ),
  accountStatement: async (params: AccountStatementParams): Promise<AccountStatement> =>
    AccountStatementSchema.parse(
      await apiClient.get("/reports/account-statement", {
        params: {
          party_type: params.party_type,
          party_id: params.party_id,
          from: params.from,
          to: params.to,
        },
      }),
    ),
  exportEvidenceExceptions: async (
    params: ExportEvidenceExceptionParams = {},
  ): Promise<ExportEvidenceException> =>
    ExportEvidenceExceptionSchema.parse(
      await apiClient.get("/reports/export-evidence-exceptions", {
        params: { as_of: params.as_of },
      }),
    ),
  invoicedNotDispatched: async (): Promise<InvoicedNotDispatched> =>
    InvoicedNotDispatchedSchema.parse(await apiClient.get("/reports/invoiced-not-dispatched")),
};
