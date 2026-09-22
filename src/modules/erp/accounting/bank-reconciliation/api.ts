import { z } from "zod";

import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  BankStatementSchema,
  BookEntryCandidateSchema,
  MatchSuggestionSchema,
  ReconciliationStatementSchema,
  type BankStatement,
  type BankStatementListParams,
  type BookEntryCandidate,
  type MatchSuggestion,
  type ReconciliationStatement,
} from "@/modules/erp/accounting/bank-reconciliation/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders, postDocumentHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";
import { ImportResultSchema, type ImexMappingEntry, type ImportResult } from "@/shared/lib/imex";
import { randomUuid } from "@/shared/lib/uuid";

export const bankReconciliationApi = {
  list: async (params: BankStatementListParams = {}): Promise<ListResponse<BankStatement[]>> => {
    const result = await apiClient.getList<unknown>("/bank-reconciliation", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        bank_account_id: params.bank_account_id,
        status: params.status,
      },
    });
    return {
      data: z.array(BankStatementSchema).parse(result.data),
      meta: result.meta,
    };
  },
  get: async (id: string): Promise<BankStatement> =>
    BankStatementSchema.parse(await apiClient.get(`/bank-reconciliation/${id}`)),
  create: async (payload: unknown): Promise<BankStatement> =>
    BankStatementSchema.parse(await apiClient.post("/bank-reconciliation", payload)),
  bookEntries: async (id: string): Promise<BookEntryCandidate[]> => {
    const rows = await apiClient.get<unknown[]>(`/bank-reconciliation/${id}/book-entries`);
    return z.array(BookEntryCandidateSchema).parse(rows);
  },
  suggestedMatches: async (id: string): Promise<MatchSuggestion[]> => {
    const rows = await apiClient.get<unknown[]>(`/bank-reconciliation/${id}/suggested-matches`);
    return z.array(MatchSuggestionSchema).parse(rows);
  },
  reconciliationStatement: async (id: string): Promise<ReconciliationStatement> =>
    ReconciliationStatementSchema.parse(
      await apiClient.get(`/bank-reconciliation/${id}/reconciliation-statement`),
    ),
  match: async (
    id: string,
    payload: { statement_line_id: string; journal_line_id: string; version: number },
  ): Promise<BankStatement> =>
    BankStatementSchema.parse(
      await apiClient.post(`/bank-reconciliation/${id}/match`, payload, {
        headers: ifMatchHeaders(payload.version),
      }),
    ),
  exclude: async (
    id: string,
    payload: { statement_line_id: string; version: number },
  ): Promise<BankStatement> =>
    BankStatementSchema.parse(
      await apiClient.post(`/bank-reconciliation/${id}/exclude`, payload, {
        headers: ifMatchHeaders(payload.version),
      }),
    ),
  unmatch: async (
    id: string,
    payload: { statement_line_id: string; version: number },
  ): Promise<BankStatement> =>
    BankStatementSchema.parse(
      await apiClient.post(`/bank-reconciliation/${id}/unmatch`, payload, {
        headers: ifMatchHeaders(payload.version),
      }),
    ),
  reconcile: async (id: string, version: number): Promise<BankStatement> =>
    BankStatementSchema.parse(
      await apiClient.post(
        `/bank-reconciliation/${id}/reconcile`,
        {},
        { headers: postDocumentHeaders(version) },
      ),
    ),
  importFile: async (
    file: File,
    mapping: ImexMappingEntry[],
    metadata: {
      bank_account_id: string;
      period_start: string;
      period_end: string;
      opening_balance: string;
      closing_balance: string;
    },
  ): Promise<ImportResult> => {
    const body = new FormData();
    body.append("file", file);
    body.append("mapping", JSON.stringify(mapping));
    body.append("bank_account_id", metadata.bank_account_id);
    body.append("period_start", metadata.period_start);
    body.append("period_end", metadata.period_end);
    body.append("opening_balance", metadata.opening_balance);
    body.append("closing_balance", metadata.closing_balance);
    return ImportResultSchema.parse(
      await apiClient.postForm("/bank-reconciliation/import", body, {
        headers: { "Idempotency-Key": randomUuid() },
      }),
    );
  },
};
