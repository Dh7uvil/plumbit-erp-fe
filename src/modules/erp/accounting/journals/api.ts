import { DEFAULT_PAGE_SIZE, OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  JournalEntryCreateRequestSchema,
  JournalEntryListSchema,
  JournalEntrySchema,
  JournalEntryUpdateRequestSchema,
  type JournalEntry,
  type JournalEntryCreateRequest,
  type JournalEntryUpdateRequest,
  type JournalFormValues,
  type JournalLineFormValues,
  type JournalLineInput,
  type JournalListParams,
  isBlankJournalLine,
} from "@/modules/erp/accounting/journals/schemas";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders, postDocumentHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function zeroIfEmpty(value: string): string {
  const trimmed = value.trim();
  return trimmed ? trimmed : "0";
}

function toLineInput(line: JournalLineFormValues): JournalLineInput {
  const partyId = optionalUuid(line.party_id);
  const partyType = optionalUuid(line.party_type);
  return {
    account_id: line.account_id,
    debit: zeroIfEmpty(line.debit),
    credit: zeroIfEmpty(line.credit),
    party_type: partyId ? (partyType as "CUSTOMER" | "SUPPLIER" | null) : null,
    party_id: partyId,
    due_date: emptyToNull(line.due_date),
    external_reference: emptyToNull(line.external_reference),
    description: emptyToNull(line.description),
  };
}

export function toJournalPayload(values: JournalFormValues): JournalEntryCreateRequest {
  return {
    entry_date: emptyToNull(values.entry_date),
    currency_id: values.currency_id,
    exchange_rate: emptyToNull(values.exchange_rate),
    branch_id: optionalUuid(values.branch_id),
    narration: emptyToNull(values.narration),
    reference: emptyToNull(values.reference),
    lines: values.lines.filter((line) => !isBlankJournalLine(line)).map(toLineInput),
  };
}

export type JournalWriteOptions = {
  version: number;
};

export const journalsApi = {
  list: async (params: JournalListParams = {}): Promise<ListResponse<JournalEntry[]>> => {
    const result = await apiClient.getList<unknown>("/journals", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        journal_type: params.journal_type,
        account_id: params.account_id,
        party_id: params.party_id,
        branch_id: params.branch_id,
        entry_date_from: params.entry_date_from,
        entry_date_to: params.entry_date_to,
      },
    });
    return { data: JournalEntryListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<JournalEntry> =>
    JournalEntrySchema.parse(await apiClient.get(`/journals/${id}`)),
  create: async (values: JournalEntryCreateRequest): Promise<JournalEntry> =>
    JournalEntrySchema.parse(
      await apiClient.post("/journals", JournalEntryCreateRequestSchema.parse(values)),
    ),
  update: async (
    id: string,
    values: JournalEntryUpdateRequest,
    options: JournalWriteOptions,
  ): Promise<JournalEntry> =>
    JournalEntrySchema.parse(
      await apiClient.patch(
        `/journals/${id}`,
        JournalEntryUpdateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  post: async (id: string, options: JournalWriteOptions): Promise<JournalEntry> =>
    JournalEntrySchema.parse(
      await apiClient.post(`/journals/${id}/post`, undefined, {
        headers: postDocumentHeaders(options.version),
      }),
    ),
  cancel: async (
    id: string,
    options: JournalWriteOptions & { reason?: string | null },
  ): Promise<JournalEntry> =>
    JournalEntrySchema.parse(
      await apiClient.post(
        `/journals/${id}/cancel`,
        { reason: options.reason ?? null, version: options.version },
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  reverse: async (
    id: string,
    options: JournalWriteOptions & { reason?: string | null; reversal_date?: string | null },
  ): Promise<JournalEntry> =>
    JournalEntrySchema.parse(
      await apiClient.post(
        `/journals/${id}/reverse`,
        {
          reason: options.reason ?? null,
          reversal_date: options.reversal_date ?? null,
          version: options.version,
        },
        { headers: postDocumentHeaders(options.version) },
      ),
    ),
  delete: async (id: string, options: JournalWriteOptions): Promise<JournalEntry> =>
    JournalEntrySchema.parse(
      await apiClient.delete(`/journals/${id}`, { headers: ifMatchHeaders(options.version) }),
    ),
};
