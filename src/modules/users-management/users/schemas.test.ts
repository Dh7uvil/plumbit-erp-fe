import { describe, expect, it } from "vitest";

import {
  emptyEmployeeFormValues,
  toEmployeeUpsert,
  UserCreateFormSchema,
  UserUpdateFormSchema,
} from "@/modules/users-management/users/schemas";

describe("toEmployeeUpsert", () => {
  it("omits employee_code and still returns a payload when HR fields are empty", () => {
    const payload = toEmployeeUpsert(emptyEmployeeFormValues());
    expect(payload).toEqual({
      branch_id: null,
      department_id: null,
      designation: null,
      joining_date: null,
    });
    expect(payload).not.toHaveProperty("employee_code");
  });

  it("maps filled HR fields without employee_code", () => {
    const payload = toEmployeeUpsert({
      branch_id: "11111111-1111-4111-8111-111111111111",
      department_id: "none",
      designation: "  Manager  ",
      joining_date: "2026-01-15",
    });
    expect(payload).toEqual({
      branch_id: "11111111-1111-4111-8111-111111111111",
      department_id: null,
      designation: "Manager",
      joining_date: "2026-01-15",
    });
    expect(payload).not.toHaveProperty("employee_code");
  });
});

describe("user form schemas", () => {
  const emptyEmployee = emptyEmployeeFormValues();

  it("accepts create values with empty employee fields and no typed code", () => {
    const result = UserCreateFormSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "password1",
      phone: "",
      status: "ACTIVE",
      role_ids: [],
      ...emptyEmployee,
    });
    expect(result.success).toBe(true);
  });

  it("accepts update values with empty employee fields and no typed code", () => {
    const result = UserUpdateFormSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "",
      status: "ACTIVE",
      role_ids: [],
      ...emptyEmployee,
    });
    expect(result.success).toBe(true);
  });
});
