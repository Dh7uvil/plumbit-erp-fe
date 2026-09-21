"use client";

import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_VARIANTS,
  type CampaignStatus,
} from "@/modules/crm/campaigns/schemas";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <DocumentStatusBadge
      status={status}
      labels={CAMPAIGN_STATUS_LABELS}
      variants={CAMPAIGN_STATUS_VARIANTS}
    />
  );
}
