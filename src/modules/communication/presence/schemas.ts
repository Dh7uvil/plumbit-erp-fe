import { z } from "zod";

export const PresenceStatusSchema = z.enum(["ONLINE", "AWAY", "BUSY", "OFFLINE"]);
export type PresenceStatus = z.infer<typeof PresenceStatusSchema>;

export const PresenceSchema = z.object({
  user_id: z.string().uuid(),
  status: PresenceStatusSchema,
  custom_status: z.string().nullable(),
  last_seen_at: z.string().nullable(),
  last_heartbeat_at: z.string().nullable(),
});
export type Presence = z.infer<typeof PresenceSchema>;

export const PresenceListSchema = z.array(PresenceSchema);

export const HeartbeatRequestSchema = z.object({
  status: PresenceStatusSchema.default("ONLINE"),
  custom_status: z.string().max(100).nullable().optional(),
});
export type HeartbeatRequest = z.infer<typeof HeartbeatRequestSchema>;
