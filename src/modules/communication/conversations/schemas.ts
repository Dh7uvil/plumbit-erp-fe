import { z } from "zod";

export const ConversationKindSchema = z.enum(["DIRECT", "GROUP"]);
export type ConversationKind = z.infer<typeof ConversationKindSchema>;

export const ParticipantRoleSchema = z.enum(["OWNER", "ADMIN", "MEMBER"]);
export type ParticipantRole = z.infer<typeof ParticipantRoleSchema>;

export const ParticipantSchema = z.object({
  user_id: z.string().uuid(),
  role: ParticipantRoleSchema,
  joined_at: z.string(),
  last_read_seq: z.number().default(0),
  last_delivered_seq: z.number().default(0).optional(),
  is_muted: z.boolean(),
  is_pinned: z.boolean(),
});
export type Participant = z.infer<typeof ParticipantSchema>;

export const LastMessagePreviewSchema = z.object({
  id: z.string().uuid(),
  sender_id: z.string().uuid().nullable(),
  body: z.string().nullable(),
  kind: z.string(),
  created_at: z.string(),
});
export type LastMessagePreview = z.infer<typeof LastMessagePreviewSchema>;

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  kind: ConversationKindSchema,
  name: z.string().nullable(),
  description: z.string().nullable(),
  channel_name: z.string(),
  message_seq: z.number(),
  last_message_at: z.string().nullable(),
  last_message: LastMessagePreviewSchema.nullable().optional(),
  only_admins_can_post: z.boolean(),
  is_locked: z.boolean(),
  unread_count: z.number().default(0),
  participants: z.array(ParticipantSchema).default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Conversation = z.infer<typeof ConversationSchema>;

export const ConversationListSchema = z.array(ConversationSchema);

export const ConversationCreateRequestSchema = z.object({
  kind: ConversationKindSchema,
  name: z.string().max(200).nullable().optional(),
  description: z.string().nullable().optional(),
  participant_user_ids: z.array(z.string().uuid()).optional(),
  other_user_id: z.string().uuid().nullable().optional(),
});
export type ConversationCreateRequest = z.infer<typeof ConversationCreateRequestSchema>;

export const ConversationForContextRequestSchema = z.object({
  context_entity_type: z.string().min(1).max(50),
  context_entity_id: z.string().uuid(),
  participant_user_ids: z.array(z.string().uuid()).optional(),
  name: z.string().max(200).nullable().optional(),
});
export type ConversationForContextRequest = z.infer<typeof ConversationForContextRequestSchema>;

export const ConversationUpdateRequestSchema = z.object({
  name: z.string().max(200).nullable().optional(),
  description: z.string().nullable().optional(),
  only_admins_can_post: z.boolean().optional(),
  is_locked: z.boolean().optional(),
});
export type ConversationUpdateRequest = z.infer<typeof ConversationUpdateRequestSchema>;

export const ParticipantAddRequestSchema = z.object({
  user_id: z.string().uuid(),
  role: ParticipantRoleSchema.default("MEMBER"),
});
export type ParticipantAddRequest = z.infer<typeof ParticipantAddRequestSchema>;

export const ReadMarkerRequestSchema = z.object({
  up_to_seq: z.number().int().min(0),
});
export type ReadMarkerRequest = z.infer<typeof ReadMarkerRequestSchema>;

export const ConversationAttachmentSchema = z.object({
  attachment_id: z.string().uuid(),
  message_id: z.string().uuid(),
  seq: z.number(),
  original_filename: z.string(),
  content_type: z.string(),
  size_bytes: z.number(),
  thumbnail_url: z.string().nullable().optional(),
});
export type ConversationAttachment = z.infer<typeof ConversationAttachmentSchema>;

export const UnreadSummarySchema = z.object({
  total_unread: z.number(),
  conversations: z.array(z.record(z.string(), z.unknown())).default([]),
});
export type UnreadSummary = z.infer<typeof UnreadSummarySchema>;

export type ConversationListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  kind?: ConversationKind;
};
