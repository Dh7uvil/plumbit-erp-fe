"use client";

import { publicEnv } from "@/config/env.public";
import { aiAssistantPermissions } from "@/modules/erp/ai-assistant/permissions";
import { AiAssistantPanel } from "@/modules/erp/ai-assistant/components/ai-assistant-panel";
import { useCan } from "@/shared/providers/session-provider";

export function AiAssistantMount() {
  const can = useCan();

  if (!publicEnv.NEXT_PUBLIC_FEATURE_AI_ASSISTANT_ENABLED || !can(aiAssistantPermissions.use)) {
    return null;
  }

  return <AiAssistantPanel />;
}
