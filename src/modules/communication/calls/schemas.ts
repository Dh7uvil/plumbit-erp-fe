import { z } from "zod";

export const CallKindSchema = z.enum(["AUDIO", "VIDEO"]);
export type CallKind = z.infer<typeof CallKindSchema>;

export const CallScopeSchema = z.enum(["DIRECT", "GROUP"]);
export type CallScope = z.infer<typeof CallScopeSchema>;

export const CallStatusSchema = z.enum([
  "RINGING",
  "ACTIVE",
  "REJECTED",
  "MISSED",
  "CANCELLED",
  "ENDED",
]);
export type CallStatus = z.infer<typeof CallStatusSchema>;

export const CallParticipantStatusSchema = z.enum([
  "RINGING",
  "JOINED",
  "LEFT",
  "REJECTED",
  "MISSED",
  "BUSY",
]);
export type CallParticipantStatus = z.infer<typeof CallParticipantStatusSchema>;

export const CallParticipantSchema = z.object({
  user_id: z.string().uuid(),
  rtc_uid: z.number(),
  status: CallParticipantStatusSchema,
  is_audio_muted: z.boolean(),
  is_video_enabled: z.boolean(),
  is_screen_sharing: z.boolean(),
});
export type CallParticipant = z.infer<typeof CallParticipantSchema>;

export const CallSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  channel_name: z.string(),
  kind: CallKindSchema,
  scope: CallScopeSchema,
  status: CallStatusSchema,
  initiated_by: z.string().uuid().nullable(),
  started_at: z.string(),
  answered_at: z.string().nullable(),
  ended_at: z.string().nullable(),
  end_reason: z.string().nullable(),
  duration_seconds: z.number().nullable(),
  participants: z.array(CallParticipantSchema).default([]),
  rtc_token: z.string().nullable().optional(),
  rtc_uid: z.number().nullable().optional(),
  token_expires_at: z.string().nullable().optional(),
});
export type Call = z.infer<typeof CallSchema>;

export const CallListSchema = z.array(CallSchema);

export const CallCreateRequestSchema = z
  .object({
    conversation_id: z.string().uuid().nullable().optional(),
    user_id: z.string().uuid().nullable().optional(),
    kind: CallKindSchema.default("VIDEO"),
  })
  .refine((value) => value.conversation_id != null || value.user_id != null, {
    message: "Either conversation_id or user_id is required",
  });
export type CallCreateRequest = z.infer<typeof CallCreateRequestSchema>;

export const CallMediaUpdateRequestSchema = z.object({
  is_audio_muted: z.boolean().optional(),
  is_video_enabled: z.boolean().optional(),
  is_screen_sharing: z.boolean().optional(),
});
export type CallMediaUpdateRequest = z.infer<typeof CallMediaUpdateRequestSchema>;

export type CallListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: CallStatus;
  conversation_id?: string;
  mine?: boolean;
};
