import { z } from "zod";

import { apiClient, type RequestParams } from "@/shared/api/client";
import { randomUuid } from "@/shared/lib/uuid";

export const ImexColumnSchema = z.object({
  index: z.number().int(),
  header: z.string(),
});
export type ImexColumn = z.infer<typeof ImexColumnSchema>;

export const ImexMappingEntrySchema = z.object({
  column: z.string(),
  field: z.string(),
});
export type ImexMappingEntry = z.infer<typeof ImexMappingEntrySchema>;

export const ImportPreviewSchema = z.object({
  columns: z.array(ImexColumnSchema).optional().default([]),
  suggested_mapping: z.array(ImexMappingEntrySchema).optional().default([]),
  sample_rows: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  row_count: z.number().int().optional().default(0),
});
export type ImportPreview = z.infer<typeof ImportPreviewSchema>;

export const ImportRowErrorSchema = z.object({
  row_number: z.number().int(),
  message: z.string(),
});
export type ImportRowError = z.infer<typeof ImportRowErrorSchema>;

export const ImportResultSchema = z.object({
  created_ids: z.array(z.string().uuid()).optional().default([]),
  errors: z.array(ImportRowErrorSchema).optional().default([]),
  created_count: z.number().int().optional().default(0),
  error_count: z.number().int().optional().default(0),
});
export type ImportResult = z.infer<typeof ImportResultSchema>;

export const imexApi = {
  downloadTemplate: (resource: string, filename: string): Promise<void> =>
    apiClient.downloadFile(`/${resource}/import/template`, {
      filename,
      accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  exportList: (resource: string, params: RequestParams, filename: string): Promise<void> =>
    apiClient.downloadFile(`/${resource}/export`, {
      params,
      filename,
      accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  preview: async (resource: string, file: File): Promise<ImportPreview> => {
    const body = new FormData();
    body.append("file", file);
    return ImportPreviewSchema.parse(await apiClient.postForm(`/${resource}/import/preview`, body));
  },
  importFile: async (
    resource: string,
    file: File,
    mapping: ImexMappingEntry[],
  ): Promise<ImportResult> => {
    const body = new FormData();
    body.append("file", file);
    body.append("mapping", JSON.stringify(mapping));
    return ImportResultSchema.parse(
      await apiClient.postForm(`/${resource}/import`, body, {
        headers: { "Idempotency-Key": randomUuid() },
      }),
    );
  },
};
