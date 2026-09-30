import { z } from "zod";

export const AiContextEntitySchema = z.object({
  entity_type: z.string().nullable().optional(),
  entity_id: z.string().uuid().nullable().optional(),
});

export type AiContextEntity = z.infer<typeof AiContextEntitySchema>;

export const AiAssistRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
  context: AiContextEntitySchema.nullable().optional(),
});

export type AiAssistRequest = z.infer<typeof AiAssistRequestSchema>;

export const AiSuggestionSchema = z.object({
  title: z.string(),
  body: z.string(),
});

export type AiSuggestion = z.infer<typeof AiSuggestionSchema>;

export const AiAssistResponseSchema = z.object({
  suggestions: z.array(AiSuggestionSchema),
  provider: z.string(),
  read_only: z.boolean(),
  request_id: z.string().uuid(),
});

export type AiAssistResponse = z.infer<typeof AiAssistResponseSchema>;
