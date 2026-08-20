import { z } from "zod";

import {
  AddressFormSchema,
  AddressPayloadSchema,
} from "@/modules/users-management/tenants/schemas";

export const BranchStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
export type BranchStatus = z.infer<typeof BranchStatusSchema>;

export const BranchSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  status: BranchStatusSchema,
  phone: z.string().nullable(),
  timezone: z.string().nullable(),
  address: AddressPayloadSchema.nullable().default(null),
  employee_count: z.number().int().nonnegative().default(0),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Branch = z.infer<typeof BranchSchema>;

export const BranchListSchema = z.array(BranchSchema);

export const BranchCreateRequestSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(50),
  status: BranchStatusSchema.optional(),
  phone: z.string().max(50).nullable().optional(),
  timezone: z.string().max(100).nullable().optional(),
  address: AddressPayloadSchema.nullable().optional(),
});
export type BranchCreateRequest = z.infer<typeof BranchCreateRequestSchema>;

export const BranchUpdateRequestSchema = z.object({
  name: z.string().min(1).max(200).nullable().optional(),
  code: z.string().min(1).max(50).nullable().optional(),
  status: BranchStatusSchema.nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  timezone: z.string().max(100).nullable().optional(),
  address: AddressPayloadSchema.nullable().optional(),
});
export type BranchUpdateRequest = z.infer<typeof BranchUpdateRequestSchema>;

export const BranchFormSchema = z.object({
  name: z.string().min(1, "Enter a name").max(200),
  code: z.string().min(1, "Enter a code").max(50),
  status: BranchStatusSchema,
  phone: z.string().max(50),
  timezone: z.string().max(100),
  address: AddressFormSchema,
});
export type BranchFormValues = z.infer<typeof BranchFormSchema>;

export type BranchListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  status?: BranchStatus;
};
