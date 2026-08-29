import { z } from "zod";

export const AttachmentEntityTypeSchema = z.enum([
  "CUSTOMER",
  "CONTACT",
  "PRODUCT",
  "QUOTATION",
  "BRANCH",
  "EMPLOYEE",
]);
export type AttachmentEntityType = z.infer<typeof AttachmentEntityTypeSchema>;

export const AttachmentSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  entity_type: AttachmentEntityTypeSchema,
  entity_id: z.string().uuid(),
  original_filename: z.string(),
  content_type: z.string(),
  size_bytes: z.number().int().nonnegative(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Attachment = z.infer<typeof AttachmentSchema>;

export const AttachmentListSchema = z.array(AttachmentSchema);

export const AttachmentDetailSchema = AttachmentSchema.extend({
  download_url: z.string(),
});
export type AttachmentDetail = z.infer<typeof AttachmentDetailSchema>;

export type AttachmentListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  entity_type: AttachmentEntityType;
  entity_id: string;
};
