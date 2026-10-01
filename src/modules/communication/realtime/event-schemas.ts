import { z } from "zod";

export const RealtimeEventSchema = z.object({
  v: z.number().default(1),
  type: z.string(),
  tenant_id: z.string().uuid().nullable().optional(),
  conversation_id: z.string().uuid().nullable().optional(),
  seq: z.number().nullable().optional(),
  actor_id: z.string().uuid().nullable().optional(),
  at: z.string().nullable().optional(),
  data: z.record(z.string(), z.unknown()).default({}),
  truncated: z.boolean().optional(),
  event_id: z.string().uuid().optional(),
});
export type RealtimeEvent = z.infer<typeof RealtimeEventSchema>;

export function parseRealtimeEvent(raw: string): RealtimeEvent | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return RealtimeEventSchema.parse(parsed);
  } catch {
    return null;
  }
}

export const MESSAGE_EVENT_TYPES = new Set([
  "message.created",
  "message.updated",
  "message.deleted",
  "message.read",
  "message.delivered",
]);

export const CALL_EVENT_TYPES = new Set([
  "call.invited",
  "call.accepted",
  "call.rejected",
  "call.participant_joined",
  "call.participant_left",
  "call.media_changed",
  "call.ended",
  "call.missed",
]);

export const CONVERSATION_EVENT_TYPES = new Set([
  "conversation.created",
  "conversation.updated",
  "participant.added",
  "participant.removed",
  "participant.role_changed",
  "typing.started",
  "typing.stopped",
]);
