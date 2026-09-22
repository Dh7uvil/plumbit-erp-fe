"use client";

import type { ReactNode } from "react";

import { bankReconciliationPermissions } from "@/modules/erp/accounting/bank-reconciliation/permissions";
import { AccessDenied } from "@/shared/components/feedback/access-denied";
import { useCan } from "@/shared/providers/session-provider";

export function BankReconciliationNewGate({ children }: { children: ReactNode }) {
  const can = useCan();
  const canCreate = can(bankReconciliationPermissions.create);
  const canImport = can(bankReconciliationPermissions.import);
  if (!canCreate && !canImport) {
    return <AccessDenied />;
  }
  return children;
}
