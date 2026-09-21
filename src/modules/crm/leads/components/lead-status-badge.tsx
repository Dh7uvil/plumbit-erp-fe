"use client";

import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_VARIANTS,
  type LeadStatus,
} from "@/modules/crm/leads/schemas";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <DocumentStatusBadge
      status={status}
      labels={LEAD_STATUS_LABELS}
      variants={LEAD_STATUS_VARIANTS}
    />
  );
}
