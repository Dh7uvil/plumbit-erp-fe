import {
  AiAssistRequestSchema,
  AiAssistResponseSchema,
  type AiAssistRequest,
  type AiAssistResponse,
} from "@/modules/erp/ai-assistant/schemas";
import { apiClient } from "@/shared/api/client";

export const aiAssistantApi = {
  assist: async (payload: AiAssistRequest): Promise<AiAssistResponse> => {
    const body = AiAssistRequestSchema.parse(payload);
    return AiAssistResponseSchema.parse(await apiClient.post("/ai/assist", body));
  },
};
