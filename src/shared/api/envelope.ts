import { z } from "zod";

export const PaginationMetaSchema = z.object({
  page: z.number().int(),
  page_size: z.number().int(),
  total: z.number().int(),
  total_pages: z.number().int(),
});

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

export type ListResponse<T> = {
  data: T;
  meta: PaginationMeta;
};

export function parseListMeta(meta: unknown, itemCount: number): PaginationMeta {
  const parsed = PaginationMetaSchema.safeParse(meta);
  if (parsed.success) {
    return parsed.data;
  }
  return {
    page: 1,
    page_size: itemCount,
    total: itemCount,
    total_pages: itemCount > 0 ? 1 : 0,
  };
}

export const ApiErrorBodySchema = z.object({
  code: z.string(),
  message: z.string().optional(),
  details: z.unknown().optional(),
});

export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;

export const EnvelopeSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  message: z.string().nullable().optional(),
  meta: z.unknown().optional(),
  error: ApiErrorBodySchema.optional(),
});

export type Envelope = z.infer<typeof EnvelopeSchema>;

export const SuccessEnvelopeSchema = z.object({
  success: z.boolean().optional(),
  data: z.unknown().optional(),
  message: z.string().nullable().optional(),
  meta: z.unknown().optional(),
});

export const ErrorEnvelopeSchema = z.object({
  success: z.boolean().optional(),
  error: ApiErrorBodySchema,
});

export const FastApiValidationSchema = z.object({
  detail: z.array(
    z.object({
      loc: z.array(z.union([z.string(), z.number()])),
      msg: z.string(),
      type: z.string().optional(),
    }),
  ),
});

export type UnwrappedResponse<T> = {
  data: T;
  meta?: unknown;
  message?: string;
};

export function parseEnvelope(payload: unknown): Envelope {
  return EnvelopeSchema.parse(payload);
}
