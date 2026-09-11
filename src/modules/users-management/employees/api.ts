import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  EmployeePickerListSchema,
  type EmployeeListParams,
  type EmployeePicker,
} from "@/modules/users-management/employees/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const employeesApi = {
  list: async (params: EmployeeListParams = {}): Promise<ListResponse<EmployeePicker[]>> => {
    const result = await apiClient.getList<unknown>("/employees", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        status: params.status,
        branch_id: params.branch_id,
        department_id: params.department_id,
      },
    });
    return { data: EmployeePickerListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (params: Omit<EmployeeListParams, "page" | "page_size"> = {}): Promise<EmployeePicker[]> =>
    fetchAllPages((page, pageSize) => employeesApi.list({ ...params, page, page_size: pageSize })),
};
