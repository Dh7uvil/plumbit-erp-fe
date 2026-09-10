import { z } from "zod";

export const AttachmentEntityTypeSchema = z.enum([
  "CUSTOMER",
  "SUPPLIER",
  "CONTACT",
  "PRODUCT",
  "QUOTATION",
  "SALES_ORDER",
  "PURCHASE_ORDER",
  "BRANCH",
  "EMPLOYEE",
  "STOCK_TRANSFER",
  "STOCK_ADJUSTMENT",
  "PROFORMA_INVOICE",
  "GOODS_RECEIPT",
  "QUALITY_INSPECTION",
  "PACKAGE",
  "SHIPMENT",
  "SALES_INVOICE",
  "PURCHASE_INVOICE",
  "CREDIT_NOTE",
  "DEBIT_NOTE",
  "DELIVERY_NOTE",
  "SALES_RETURN",
  "JOURNAL_ENTRY",
  "ACCOUNT",
]);
export type AttachmentEntityType = z.infer<typeof AttachmentEntityTypeSchema>;

export const ATTACHMENT_CATEGORIES = [
  "QC_PHOTO",
  "TEST_CERTIFICATE",
  "LOADING_PHOTO",
  "SEAL_PHOTO",
  "BL_DOCUMENT",
  "CUSTOMS_DOC",
  "CUSTOMER_PO",
  "SUPPLIER_INVOICE",
  "TRADE_LICENCE",
  "POD",
  "RETURN_PHOTO",
  "PACKING_LIST",
  "DISPATCH_PHOTO",
  "OTHER",
] as const;
export const AttachmentCategorySchema = z.enum(ATTACHMENT_CATEGORIES);
export type AttachmentCategory = z.infer<typeof AttachmentCategorySchema>;

export const ATTACHMENT_CATEGORY_LABELS: Record<AttachmentCategory, string> = {
  QC_PHOTO: "QC photos",
  TEST_CERTIFICATE: "Test certificates",
  LOADING_PHOTO: "Loading photos",
  SEAL_PHOTO: "Seal photos",
  BL_DOCUMENT: "Bills of lading",
  CUSTOMS_DOC: "Customs documents",
  CUSTOMER_PO: "Customer POs",
  SUPPLIER_INVOICE: "Supplier invoices",
  TRADE_LICENCE: "Trade licences",
  POD: "Proof of delivery",
  RETURN_PHOTO: "Return photos",
  PACKING_LIST: "Packing lists",
  DISPATCH_PHOTO: "Dispatch photos",
  OTHER: "Other",
};

export const IMAGE_ATTACHMENT_CATEGORIES = new Set<AttachmentCategory>([
  "QC_PHOTO",
  "LOADING_PHOTO",
  "SEAL_PHOTO",
  "RETURN_PHOTO",
  "DISPATCH_PHOTO",
  "POD",
]);

export const AttachmentSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  entity_type: AttachmentEntityTypeSchema,
  entity_id: z.string().uuid(),
  original_filename: z.string(),
  content_type: z.string(),
  size_bytes: z.number().int().nonnegative(),
  category: AttachmentCategorySchema.nullable(),
  image_width: z.number().int().nullable(),
  image_height: z.number().int().nullable(),
  thumbnail_url: z.string().nullable().optional(),
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
  category?: AttachmentCategory;
};

export function isImageAttachment(attachment: Attachment): boolean {
  if (attachment.content_type.startsWith("image/")) {
    return true;
  }
  if (attachment.category && IMAGE_ATTACHMENT_CATEGORIES.has(attachment.category)) {
    return Boolean(attachment.thumbnail_url);
  }
  return Boolean(attachment.thumbnail_url);
}
