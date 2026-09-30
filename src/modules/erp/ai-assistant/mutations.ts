"use client";

import { useMutation } from "@tanstack/react-query";

import { aiAssistantApi } from "@/modules/erp/ai-assistant/api";
import type { AiAssistRequest } from "@/modules/erp/ai-assistant/schemas";

export function useAiAssist() {
  return useMutation({
    mutationFn: (payload: AiAssistRequest) => aiAssistantApi.assist(payload),
  });
}
