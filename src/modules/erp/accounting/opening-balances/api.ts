import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  OpeningBalancePayloadSchema,
  OpeningBalancePreviewSchema,
  OpeningBalanceStateSchema,
  type OpeningBalanceFormValues,
  type OpeningBalancePayload,
  type OpeningBalancePreview,
  type OpeningBalanceState,
} from "@/modules/erp/accounting/opening-balances/schemas";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";
import { apiClient } from "@/shared/api/client";
import { randomUuid } from "@/shared/lib/uuid";

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function zeroIfEmpty(value: string): string {
  return value.trim() ? value.trim() : "0";
}

export function toOpeningBalancePayload(values: OpeningBalanceFormValues): OpeningBalancePayload {
  return {
    books_start_date: values.books_start_date,
    gl_lines: values.gl_lines
      .filter((line) => optionalUuid(line.account_id))
      .map((line) => ({
        account_id: line.account_id,
        debit: zeroIfEmpty(line.debit),
        credit: zeroIfEmpty(line.credit),
        description: emptyToNull(line.description),
      })),
    ar_items: values.ar_items
      .filter((item) => optionalUuid(item.party_id) && item.amount.trim())
      .map((item) => ({
        party_id: item.party_id,
        amount: item.amount.trim(),
        due_date: item.due_date,
        external_reference: emptyToNull(item.external_reference),
        description: emptyToNull(item.description),
      })),
    ap_items: values.ap_items
      .filter((item) => optionalUuid(item.party_id) && item.amount.trim())
      .map((item) => ({
        party_id: item.party_id,
        amount: item.amount.trim(),
        due_date: item.due_date,
        external_reference: emptyToNull(item.external_reference),
        description: emptyToNull(item.description),
      })),
    stock_lines: values.stock_lines
      .filter(
        (line) =>
          optionalUuid(line.warehouse_id) && optionalUuid(line.product_id) && line.quantity.trim(),
      )
      .map((line) => ({
        warehouse_id: line.warehouse_id,
        product_id: line.product_id,
        quantity: line.quantity.trim(),
        unit_cost: zeroIfEmpty(line.unit_cost),
      })),
  };
}

export const openingBalancesApi = {
  get: async (): Promise<OpeningBalanceState> =>
    OpeningBalanceStateSchema.parse(await apiClient.get("/opening-balances")),
  preview: async (values: OpeningBalanceFormValues): Promise<OpeningBalancePreview> =>
    OpeningBalancePreviewSchema.parse(
      await apiClient.post(
        "/opening-balances/preview",
        OpeningBalancePayloadSchema.parse(toOpeningBalancePayload(values)),
      ),
    ),
  commit: async (values: OpeningBalanceFormValues): Promise<OpeningBalanceState> =>
    OpeningBalanceStateSchema.parse(
      await apiClient.post(
        "/opening-balances/commit",
        OpeningBalancePayloadSchema.parse(toOpeningBalancePayload(values)),
        { headers: { "Idempotency-Key": randomUuid() } },
      ),
    ),
  reset: async (): Promise<OpeningBalanceState> =>
    OpeningBalanceStateSchema.parse(await apiClient.post("/opening-balances/reset")),
};
