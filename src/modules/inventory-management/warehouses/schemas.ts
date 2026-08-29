import { z } from "zod";

import {
  AddressFormSchema,
  AddressPayloadSchema,
} from "@/modules/users-management/tenants/schemas";

export const WarehouseSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  address: AddressPayloadSchema.nullable().optional(),
  is_default: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Warehouse = z.infer<typeof WarehouseSchema>;

export const WarehouseListSchema = z.array(WarehouseSchema);

export const WarehouseCreateRequestSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  phone: z.string().max(50).nullable().optional(),
  address: AddressPayloadSchema.nullable().optional(),
  is_default: z.boolean().optional(),
});
export type WarehouseCreateRequest = z.infer<typeof WarehouseCreateRequestSchema>;

export const WarehouseUpdateRequestSchema = z.object({
  name: z.string().min(1).max(200).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  address: AddressPayloadSchema.nullable().optional(),
  is_default: z.boolean().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
});
export type WarehouseUpdateRequest = z.infer<typeof WarehouseUpdateRequestSchema>;

export const WarehouseFormSchema = z.object({
  code: z.string().min(1, "Enter a code").max(50),
  name: z.string().min(1, "Enter a name").max(200),
  phone: z.string().max(50),
  address: AddressFormSchema,
  is_default: z.boolean(),
  is_active: z.boolean(),
});
export type WarehouseFormValues = z.infer<typeof WarehouseFormSchema>;

export type WarehouseListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
  is_default?: boolean;
};
