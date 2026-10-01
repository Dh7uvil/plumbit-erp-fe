import { z } from "zod";

export const ChatAttachmentKindSchema = z.enum(["IMAGE", "VIDEO", "DOCUMENT", "VOICE"]);
export type ChatAttachmentKind = z.infer<typeof ChatAttachmentKindSchema>;

export const AttachmentPresignRequestSchema = z.object({
  filename: z.string().min(1).max(255),
  content_type: z.string().min(1).max(150),
  kind: ChatAttachmentKindSchema,
  conversation_id: z.string().uuid(),
});
export type AttachmentPresignRequest = z.infer<typeof AttachmentPresignRequestSchema>;

export const AttachmentPresignResponseSchema = z.object({
  attachment_id: z.string().uuid(),
  upload_url: z.string().url(),
  storage_key: z.string(),
  max_size_bytes: z.number().int().positive(),
});
export type AttachmentPresignResponse = z.infer<typeof AttachmentPresignResponseSchema>;

export const AttachmentCompleteRequestSchema = z.object({
  conversation_id: z.string().uuid(),
  client_message_id: z.string().max(64).nullable().optional(),
  duration_ms: z.number().int().min(0).nullable().optional(),
  width: z.number().int().min(1).nullable().optional(),
  height: z.number().int().min(1).nullable().optional(),
});
export type AttachmentCompleteRequest = z.infer<typeof AttachmentCompleteRequestSchema>;

export const AttachmentDownloadResponseSchema = z.object({
  attachment_id: z.string().uuid(),
  download_url: z.string().min(1),
  content_type: z.string(),
  size_bytes: z.number(),
  original_filename: z.string(),
});
export type AttachmentDownloadResponse = z.infer<typeof AttachmentDownloadResponseSchema>;
