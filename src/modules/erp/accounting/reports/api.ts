import {
  AccountStatementSchema,
  AgingSchema,
  ExportEvidenceExceptionSchema,
  GeneralLedgerSchema,
  InvoicedNotDispatchedSchema,
  PartyStatementSchema,
  TrialBalanceSchema,
  type AccountStatement,
  type AccountStatementParams,
  type Aging,
  type AgingParams,
  type CustomerStatementParams,
  type ExportEvidenceException,
  type ExportEvidenceExceptionParams,
  type GeneralLedger,
  type GeneralLedgerParams,
  type InvoicedNotDispatched,
  type PartyStatement,
  type SupplierStatementParams,
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
  arAging: async (params: AgingParams): Promise<Aging> =>
    AgingSchema.parse(await apiClient.get("/reports/ar-aging", { params: { as_of: params.as_of } })),
  apAging: async (params: AgingParams): Promise<Aging> =>
    AgingSchema.parse(await apiClient.get("/reports/ap-aging", { params: { as_of: params.as_of } })),
  customerStatement: async (params: CustomerStatementParams): Promise<PartyStatement> =>
    PartyStatementSchema.parse(
      await apiClient.get("/reports/customer-statement", {
        params: { customer_id: params.customer_id, from: params.from, to: params.to },
      }),
    ),
  supplierStatement: async (params: SupplierStatementParams): Promise<PartyStatement> =>
    PartyStatementSchema.parse(
      await apiClient.get("/reports/supplier-statement", {
        params: { supplier_id: params.supplier_id, from: params.from, to: params.to },
      }),
    ),
};
