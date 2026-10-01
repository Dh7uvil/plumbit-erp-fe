import { z } from "zod";

export const MeetingTypeSchema = z.enum([
  "Internal",
  "Customer",
  "Supplier",
  "Sales",
  "Management",
]);
export type MeetingType = z.infer<typeof MeetingTypeSchema>;

export const MeetingStatusSchema = z.enum(["Upcoming", "Completed", "Cancelled"]);
export type MeetingStatus = z.infer<typeof MeetingStatusSchema>;

export const MeetingSchema = z.object({
  id: z.string(),
  title: z.string(),
  organizer: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  type: MeetingTypeSchema,
  status: MeetingStatusSchema,
  participants: z.array(z.string()).default([]),
  agenda: z.string().nullable().optional(),
});
export type Meeting = z.infer<typeof MeetingSchema>;

export const MeetingListSchema = z.array(MeetingSchema);

export const MeetingFormSchema = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  type: MeetingTypeSchema.default("Internal"),
  participants: z.array(z.string()).default([]),
  agenda: z.string().nullable().optional(),
});
export type MeetingFormValues = z.infer<typeof MeetingFormSchema>;
