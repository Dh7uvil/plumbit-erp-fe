import { z } from "zod";

import { RoleSummarySchema } from "@/shared/auth/session-schema";

export const UserStatusSchema = z.enum(["ACTIVE", "INVITED", "DISABLED"]);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const EmployeeStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
export type EmployeeStatus = z.infer<typeof EmployeeStatusSchema>;

export const BranchSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
});
export type BranchSummary = z.infer<typeof BranchSummarySchema>;

export const DepartmentSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
});
export type DepartmentSummary = z.infer<typeof DepartmentSummarySchema>;

export const EmployeeSummarySchema = z.object({
  id: z.string().uuid(),
  employee_code: z.string(),
  designation: z.string().nullable(),
  joining_date: z.string().nullable(),
  status: EmployeeStatusSchema,
  branch: BranchSummarySchema.nullable().optional(),
  department: DepartmentSummarySchema.nullable().optional(),
});
export type EmployeeSummary = z.infer<typeof EmployeeSummarySchema>;

export const EmployeeUpsertSchema = z.object({
  employee_code: z.string().min(1).max(50),
  branch_id: z.string().uuid().nullable().optional(),
  department_id: z.string().uuid().nullable().optional(),
  designation: z.string().max(150).nullable().optional(),
  joining_date: z.string().nullable().optional(),
});
export type EmployeeUpsert = z.infer<typeof EmployeeUpsertSchema>;

export const EMPLOYEE_SELECT_NONE = "none";

export const EmployeeFormFieldsSchema = z.object({
  employee_code: z.string().max(50),
  branch_id: z.string(),
  department_id: z.string(),
  designation: z.string().max(150),
  joining_date: z.string(),
});
export type EmployeeFormFields = z.infer<typeof EmployeeFormFieldsSchema>;

function optionalSelectUuid(value: string): string | null {
  return value && value !== EMPLOYEE_SELECT_NONE ? value : null;
}

function hasEmployeeExtras(values: EmployeeFormFields): boolean {
  return Boolean(
    optionalSelectUuid(values.branch_id) ||
    optionalSelectUuid(values.department_id) ||
    values.designation.trim() ||
    values.joining_date.trim(),
  );
}

export function refineEmployeeForm(values: EmployeeFormFields, ctx: z.RefinementCtx) {
  if (hasEmployeeExtras(values) && !values.employee_code.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["employee_code"],
      message: "Enter an employee code",
    });
  }
}

export function emptyEmployeeFormValues(): EmployeeFormFields {
  return {
    employee_code: "",
    branch_id: EMPLOYEE_SELECT_NONE,
    department_id: EMPLOYEE_SELECT_NONE,
    designation: "",
    joining_date: "",
  };
}

export function employeeFormValuesFromUser(user: {
  employee: EmployeeSummary | null;
}): EmployeeFormFields {
  if (!user.employee) {
    return emptyEmployeeFormValues();
  }
  return {
    employee_code: user.employee.employee_code,
    branch_id: user.employee.branch?.id ?? EMPLOYEE_SELECT_NONE,
    department_id: user.employee.department?.id ?? EMPLOYEE_SELECT_NONE,
    designation: user.employee.designation ?? "",
    joining_date: user.employee.joining_date?.slice(0, 10) ?? "",
  };
}

export function toEmployeeUpsert(values: EmployeeFormFields): EmployeeUpsert | undefined {
  const employeeCode = values.employee_code.trim();
  if (!employeeCode && !hasEmployeeExtras(values)) {
    return undefined;
  }
  return {
    employee_code: employeeCode,
    branch_id: optionalSelectUuid(values.branch_id),
    department_id: optionalSelectUuid(values.department_id),
    designation: values.designation.trim() ? values.designation.trim() : null,
    joining_date: values.joining_date.trim() ? values.joining_date.trim() : null,
  };
}

export const UserSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  status: UserStatusSchema,
  last_login_at: z.string().nullable(),
  employee_id: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  roles: z.array(RoleSummarySchema).default([]),
  employee: EmployeeSummarySchema.nullable().default(null),
});
export type User = z.infer<typeof UserSchema>;

export const UserListSchema = z.array(UserSchema);

export const UserDetailSchema = UserSchema;
export type UserDetail = z.infer<typeof UserDetailSchema>;

export const UserCreateRequestSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().min(3).max(255),
  password: z.string().min(8).max(72),
  phone: z.string().max(50).nullable().optional(),
  status: UserStatusSchema.optional(),
  role_ids: z.array(z.string().uuid()).optional(),
  employee: EmployeeUpsertSchema.nullable().optional(),
});
export type UserCreateRequest = z.infer<typeof UserCreateRequestSchema>;

export const UserCreateFormSchema = z
  .object({
    name: z.string().min(1, "Enter a name").max(200),
    email: z.string().min(3, "Enter an email").max(255),
    password: z.string().min(8, "Use at least 8 characters").max(72),
    phone: z.string().max(50),
    status: UserStatusSchema,
    role_ids: z.array(z.string().uuid()),
  })
  .merge(EmployeeFormFieldsSchema)
  .superRefine(refineEmployeeForm);
export type UserCreateFormValues = z.infer<typeof UserCreateFormSchema>;

export const UserUpdateRequestSchema = z.object({
  name: z.string().min(1).max(200).nullable().optional(),
  email: z.string().min(3).max(255).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  status: UserStatusSchema.nullable().optional(),
  employee: EmployeeUpsertSchema.nullable().optional(),
});
export type UserUpdateRequest = z.infer<typeof UserUpdateRequestSchema>;

export const UserUpdateFormSchema = z
  .object({
    name: z.string().min(1, "Enter a name").max(200),
    email: z.string().min(3, "Enter an email").max(255),
    phone: z.string().max(50),
    status: UserStatusSchema,
    role_ids: z.array(z.string().uuid()),
  })
  .merge(EmployeeFormFieldsSchema)
  .superRefine(refineEmployeeForm);
export type UserUpdateFormValues = z.infer<typeof UserUpdateFormSchema>;

export const AssignRolesRequestSchema = z.object({
  role_ids: z.array(z.string().uuid()),
});

export type UserListSortBy =
  | "created_at"
  | "updated_at"
  | "name"
  | "email"
  | "status"
  | "last_login_at";
export type UserListSortOrder = "asc" | "desc";

export type UserListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: UserListSortBy;
  sort_order?: UserListSortOrder;
  status?: UserStatus;
  role_id?: string;
  role_ids?: string[];
  department_id?: string;
  branch_id?: string;
  designation?: string;
  joining_date?: string;
  joining_date_from?: string;
  joining_date_to?: string;
  employee_status?: EmployeeStatus;
  employee_code?: string;
  last_login_from?: string;
  last_login_to?: string;
  phone?: string;
  manager_id?: string;
};
