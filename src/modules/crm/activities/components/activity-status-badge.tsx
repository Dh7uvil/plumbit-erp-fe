"use client";

import {
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_STATUS_VARIANTS,
  type ActivityStatus,
} from "@/modules/crm/activities/schemas";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";

export function ActivityStatusBadge({ status }: { status: ActivityStatus }) {
  return (
    <DocumentStatusBadge
      status={status}
      labels={ACTIVITY_STATUS_LABELS}
      variants={ACTIVITY_STATUS_VARIANTS}
    />
  );
}
