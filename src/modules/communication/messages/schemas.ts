import { z } from "zod";

export const MessageKindSchema = z.enum(["TEXT", "ATTACHMENT", "SYSTEM", "CALL_EVENT"]);
export type MessageKind = z.infer<typeof MessageKindSchema>;

export const MessageAttachmentSchema = z.object({
  id: z.string().uuid(),
  original_filename: z.string(),
  content_type: z.string(),
  size_bytes: z.number(),
  thumbnail_url: z.string().nullable().optional(),
});
export type MessageAttachment = z.infer<typeof MessageAttachmentSchema>;

export const MessageReactionSchema = z.object({
  emoji: z.string(),
  user_id: z.string().uuid(),
});
export type MessageReaction = z.infer<typeof MessageReactionSchema>;

export const MessageReplyPreviewSchema = z.object({
  id: z.string().uuid(),
  sender_id: z.string().uuid().nullable(),
  body: z.string().nullable(),
  kind: MessageKindSchema,
  deleted_at: z.string().nullable().optional(),
});
export type MessageReplyPreview = z.infer<typeof MessageReplyPreviewSchema>;

export const ForwardedFromSchema = z.object({
  message_id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  sender_id: z.string().uuid().nullable(),
  body: z.string().nullable().optional(),
});
export type ForwardedFrom = z.infer<typeof ForwardedFromSchema>;

export const CallEventPayloadSchema = z.object({
  call_id: z.string().uuid(),
  kind: z.enum(["AUDIO", "VIDEO"]),
  duration_seconds: z.number().nullable().optional(),
  missed: z.boolean().default(false),
  end_reason: z.string().nullable().optional(),
});
export type CallEventPayload = z.infer<typeof CallEventPayloadSchema>;

export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  seq: z.number(),
  sender_id: z.string().uuid().nullable(),
  kind: MessageKindSchema,
  body: z.string().nullable(),
  reply_to_message_id: z.string().uuid().nullable(),
  client_message_id: z.string().nullable(),
  edited_at: z.string().nullable(),
  deleted_at: z.string().nullable(),
  created_at: z.string(),
  attachment: MessageAttachmentSchema.nullable().optional(),
  system_payload: z.record(z.string(), z.unknown()).nullable().optional(),
  reactions: z.array(MessageReactionSchema).optional(),
  forwarded_from_message_id: z.string().uuid().nullable().optional(),
  forwarded_from: ForwardedFromSchema.nullable().optional(),
  reply_preview: MessageReplyPreviewSchema.nullable().optional(),
});
export type Message = z.infer<typeof MessageSchema>;

export const MessageListPageSchema = z.object({
  items: z.array(MessageSchema),
  has_more: z.boolean(),
});
export type MessageListPage = z.infer<typeof MessageListPageSchema>;

export const MessageCreateRequestSchema = z.object({
  body: z.string().min(1),
  kind: MessageKindSchema.default("TEXT"),
  reply_to_message_id: z.string().uuid().nullable().optional(),
  client_message_id: z.string().max(64).nullable().optional(),
});
export type MessageCreateRequest = z.infer<typeof MessageCreateRequestSchema>;

export const MessageUpdateRequestSchema = z.object({
  body: z.string().min(1),
});
export type MessageUpdateRequest = z.infer<typeof MessageUpdateRequestSchema>;

export const MessageForwardRequestSchema = z.object({
  conversation_id: z.string().uuid(),
  client_message_id: z.string().max(64).nullable().optional(),
});
export type MessageForwardRequest = z.infer<typeof MessageForwardRequestSchema>;

export const ReactionResponseSchema = z.object({
  message_id: z.string().uuid(),
  user_id: z.string().uuid(),
  emoji: z.string(),
});
export type ReactionResponse = z.infer<typeof ReactionResponseSchema>;

export const SavedMessageResponseSchema = z.object({
  message: MessageSchema,
  saved_at: z.string(),
});
export type SavedMessageResponse = z.infer<typeof SavedMessageResponseSchema>;

export const DeliveredMarkerRequestSchema = z.object({
  up_to_seq: z.number().int().min(0),
});
export type DeliveredMarkerRequest = z.infer<typeof DeliveredMarkerRequestSchema>;

export type MessageListParams = {
  before_seq?: number;
  after_seq?: number;
  limit?: number;
};

export const MESSAGE_PAGE_SIZE = 50;
