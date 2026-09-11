"use client";

import { accountPermissions } from "@/modules/erp/accounting/accounts/permissions";
import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import type { AccountSubtype, AccountType } from "@/modules/erp/accounting/accounts/schemas";
import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { MasterSelect } from "@/shared/components/form/master-select";
import { useCan } from "@/shared/providers/session-provider";

export function AccountPicker({
  value,
  onValueChange,
  disabled = false,
  accountType,
  accountSubtype,
  placeholder = "System default",
  searchPlaceholder = "Search account…",
  "aria-label": ariaLabel,
}: {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  accountType?: AccountType;
  accountSubtype?: AccountSubtype;
  placeholder?: string;
  searchPlaceholder?: string;
  "aria-label"?: string;
}) {
  const can = useCan();
  const canRead = can(accountPermissions.read);
  const accountsQuery = useAllAccounts(
    {
      is_group: false,
      is_active: true,
      account_type: accountType,
      account_subtype: accountSubtype,
    },
    canRead,
  );
  const accounts = (accountsQuery.data ?? []).filter((account) => !account.is_group);

  return (
    <MasterSelect
      value={value}
      onValueChange={onValueChange}
      disabled={disabled || !canRead || accountsQuery.isLoading}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      aria-label={ariaLabel}
      emptyText={canRead ? "No matching accounts" : "No access to chart of accounts"}
      options={[
        { value: OPTIONAL_SELECT_NONE, label: placeholder },
        ...accounts.map((account) => ({
          value: account.id,
          label: `${account.code} — ${account.name}`,
        })),
      ]}
    />
  );
}
