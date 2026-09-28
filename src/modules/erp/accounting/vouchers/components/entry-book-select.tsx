"use client";

import { useRouter } from "next/navigation";

import { journalPermissions } from "@/modules/erp/accounting/journals/permissions";
import {
  JOURNAL_ENTRY_BOOK,
  VOUCHER_ENTRY_BOOK_ALL_OPTIONS,
  VOUCHER_ENTRY_BOOK_OPTIONS,
  type VoucherEntryBook,
  type VoucherEntryType,
} from "@/modules/erp/accounting/vouchers/schemas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useCan } from "@/shared/providers/session-provider";

export function EntryBookSelect({
  value,
  onChange,
  disabled = false,
}: {
  value: VoucherEntryBook;
  onChange: (value: VoucherEntryType) => void;
  disabled?: boolean;
}) {
  const router = useRouter();
  const can = useCan();
  const canCreateJournal = can(journalPermissions.create);

  const options = canCreateJournal
    ? VOUCHER_ENTRY_BOOK_ALL_OPTIONS
    : VOUCHER_ENTRY_BOOK_OPTIONS;

  function handleValueChange(next: string) {
    if (next === JOURNAL_ENTRY_BOOK) {
      router.replace("/vouchers/new?voucher_type=JOURNAL");
      return;
    }
    onChange(next as VoucherEntryType);
  }

  return (
    <Select value={value} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Select entry book" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
