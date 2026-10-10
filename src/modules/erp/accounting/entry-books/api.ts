import { z } from "zod";

import { VoucherEntryTypeSchema } from "@/modules/erp/accounting/vouchers/schemas";
import { apiClient } from "@/shared/api/client";
import { fetchAllPages } from "@/shared/api/paginate";

export const EntryBookSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  voucher_type: VoucherEntryTypeSchema.or(z.enum(["GENERAL_PURCHASE", "PAYMENT_VOUCHER"])),
  name: z.string(),
  series_prefix: z.string(),
  default_account_id: z.string().uuid().nullable(),
  is_active: z.boolean(),
});
export type EntryBook = z.infer<typeof EntryBookSchema>;

export const EntryBookUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  series_prefix: z.string().min(1).max(20).optional(),
  default_account_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional(),
});

export const entryBooksApi = {
  listAll: (): Promise<EntryBook[]> =>
    fetchAllPages(async (page, pageSize) => {
      const result = await apiClient.getList<unknown>("/entry-books", {
        params: { page, page_size: pageSize, sort_by: "voucher_type", sort_order: "asc" },
      });
      return { data: z.array(EntryBookSchema).parse(result.data), meta: result.meta };
    }),
  update: async (id: string, values: z.infer<typeof EntryBookUpdateSchema>): Promise<EntryBook> =>
    EntryBookSchema.parse(await apiClient.patch(`/entry-books/${id}`, values)),
};
