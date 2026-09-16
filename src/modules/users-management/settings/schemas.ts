import { z } from "zod";

export const MeUpdateSchema = z.object({
  name: z.string().min(1, "Enter a name").max(200),
  phone: z.string().max(50).nullable(),
});
export type MeUpdate = z.infer<typeof MeUpdateSchema>;

export const ProfileFormSchema = z.object({
  name: z.string().min(1, "Enter a name").max(200),
  phone: z.string().max(50),
});
export type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

export const NotificationPreferenceSchema = z.object({
  email_enabled: z.boolean(),
  in_app_enabled: z.boolean(),
  whatsapp_enabled: z.boolean(),
  is_default: z.boolean(),
});
export type NotificationPreference = z.infer<typeof NotificationPreferenceSchema>;

export const NotificationPreferenceUpdateSchema = z.object({
  email_enabled: z.boolean(),
  in_app_enabled: z.boolean(),
  whatsapp_enabled: z.boolean(),
});
export type NotificationPreferenceUpdate = z.infer<typeof NotificationPreferenceUpdateSchema>;
