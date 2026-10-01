import { z } from "zod";

export const ColleagueSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
});
export type Colleague = z.infer<typeof ColleagueSchema>;

export const ColleagueListSchema = z.array(ColleagueSchema);
