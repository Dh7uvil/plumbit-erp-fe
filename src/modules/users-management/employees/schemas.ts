import { z } from "zod";

export const EMPLOYEE_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export const EmployeeStatusSchema = z.enum(EMPLOYEE_STATUSES);
export type EmployeeStatus = z.infer<typeof EmployeeStatusSchema>;

export const EmployeePickerSchema = z.object({
  id: z.string().uuid(),
  employee_code: z.string(),
  designation: z.string().nullable(),
  status: EmployeeStatusSchema,
  user_id: z.string().uuid().nullable().optional().default(null),
  name: z.string(),
});
export type EmployeePicker = z.infer<typeof EmployeePickerSchema>;
export const EmployeePickerListSchema = z.array(EmployeePickerSchema);

export type EmployeeListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  status?: EmployeeStatus;
  branch_id?: string;
  department_id?: string;
};
