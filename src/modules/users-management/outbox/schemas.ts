import { z } from "zod";

export const OUTBOX_STATUSES = ["PENDING", "PROCESSING", "PUBLISHED", "FAILED", "DEAD"] as const;
export type OutboxStatus = (typeof OUTBOX_STATUSES)[number];

export const OUTBOX_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  PUBLISHED: "Published",
  FAILED: "Failed",
  DEAD: "Dead",
};

export const OutboxEventSchema = z
  .object({
    id: z.string().uuid(),
    event_type: z.string(),
    aggregate_type: z.string().optional().default(""),
    aggregate_id: z.string().nullable().optional(),
    status: z.string(),
    attempts: z.number().int().nonnegative().optional().default(0),
    max_attempts: z.number().int().nonnegative().nullable().optional(),
    last_error: z.string().nullable().optional(),
    available_at: z.string().nullable().optional(),
    processed_at: z.string().nullable().optional(),
    created_at: z.string(),
    updated_at: z.string().optional(),
    available_actions: z.array(z.string()).optional().default([]),
  })
  .passthrough();
export type OutboxEvent = z.infer<typeof OutboxEventSchema>;

export const OutboxEventListSchema = z.array(OutboxEventSchema);

export const OutboxEventDetailSchema = OutboxEventSchema.extend({
  payload: z.unknown().optional(),
  headers: z.unknown().optional(),
});
export type OutboxEventDetail = z.infer<typeof OutboxEventDetailSchema>;

export const OUTBOX_SORT_BY = ["created_at", "status", "event_type", "attempts"] as const;
export type OutboxSortBy = (typeof OUTBOX_SORT_BY)[number];

export function parseOutboxSortBy(value: string | undefined): OutboxSortBy | undefined {
  for (const field of OUTBOX_SORT_BY) {
    if (field === value) {
      return field;
    }
  }
  return undefined;
}

export type OutboxFilterParams = {
  search?: string;
  status?: string;
  event_type?: string;
};

export type OutboxListParams = OutboxFilterParams & {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
};
