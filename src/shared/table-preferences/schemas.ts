import { z } from "zod";

export const TablePreferenceSchema = z.object({
  table_key: z.string(),
  visible_columns: z.array(z.string()),
  column_order: z.array(z.string()),
  is_default: z.boolean(),
});

export type TablePreference = z.infer<typeof TablePreferenceSchema>;

export type TablePreferenceUpdate = {
  visible_columns: string[];
  column_order: string[];
};
