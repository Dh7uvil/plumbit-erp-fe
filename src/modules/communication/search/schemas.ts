import { z } from "zod";

export const SearchTypeSchema = z.enum([
  "messages",
  "people",
  "groups",
  "files",
  "conversations",
]);
export type SearchType = z.infer<typeof SearchTypeSchema>;

export const SearchResultItemSchema = z.object({
  type: SearchTypeSchema,
  id: z.string().uuid(),
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  conversation_id: z.string().uuid().nullable().optional(),
  seq: z.number().nullable().optional(),
  highlight: z.string().nullable().optional(),
});
export type SearchResultItem = z.infer<typeof SearchResultItemSchema>;

export const SearchResponseSchema = z.object({
  results: z.array(SearchResultItemSchema).default([]),
});
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

export type SearchParams = {
  q: string;
  type: SearchType;
  limit?: number;
};

export type ConversationMessageSearchParams = {
  q: string;
  limit?: number;
};
