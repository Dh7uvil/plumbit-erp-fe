import { z } from "zod";

import { AccountSubtypeSchema, AccountTypeSchema } from "@/modules/erp/accounting/accounts/schemas";
import { apiClient } from "@/shared/api/client";
import { fetchAllPages } from "@/shared/api/paginate";

export const FinancialCategorySchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  account_type: AccountTypeSchema,
  account_subtype: AccountSubtypeSchema.nullable().optional().default(null),
  created_at: z.string(),
  updated_at: z.string(),
});
export type FinancialCategory = z.infer<typeof FinancialCategorySchema>;

export const financialCategoriesApi = {
  listAll: (): Promise<FinancialCategory[]> =>
    fetchAllPages(async (page, pageSize) => {
      const result = await apiClient.getList<unknown>("/financial-categories", {
        params: { page, page_size: pageSize },
      });
      return { data: z.array(FinancialCategorySchema).parse(result.data), meta: result.meta };
    }),
};
