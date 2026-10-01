"use client";

import { Check, CheckCheck } from "lucide-react";

export type MessageDeliveryStatus = "sent" | "delivered" | "read" | "pending" | "failed";

export function CommMessageStatus({ status }: { status: MessageDeliveryStatus }) {
  if (status === "failed") {
    return (
      <span className="text-destructive text-[10px]" title="Failed to send">
        !
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="opacity-50" title="Sending">
        <Check className="h-3 w-3" />
      </span>
    );
  }
  if (status === "read") {
    return (
      <span title="Read">
        <CheckCheck className="h-3 w-3 text-[#1a73e8]" />
      </span>
    );
  }
  if (status === "delivered") {
    return (
      <span title="Delivered">
        <CheckCheck className="h-3 w-3 opacity-70" />
      </span>
    );
  }
  return (
    <span title="Sent">
      <Check className="h-3 w-3" />
    </span>
  );
}
