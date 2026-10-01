import {
  ColleagueListSchema,
  type Colleague,
} from "@/modules/communication/colleagues/schemas";
import { apiClient } from "@/shared/api/client";

export const colleaguesApi = {
  list: async (): Promise<Colleague[]> =>
    ColleagueListSchema.parse(await apiClient.get("/communication/colleagues")),
};
