"use client";

import { useRouter } from "next/navigation";

import { ENTRY_BOOKS } from "@/modules/erp/accounting/vouchers/entry-books";
import {
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

export function EntryBookSelect({
  value,
  onChange,
  disabled = false,
  navigateOnChange = true,
}: {
  value: VoucherEntryBook;
  onChange: (value: VoucherEntryType) => void;
  disabled?: boolean;
  navigateOnChange?: boolean;
}) {
  const router = useRouter();

  function handleValueChange(next: string) {
    if (navigateOnChange) {
      const book = ENTRY_BOOKS.find((row) => row.value === next);
      if (book) {
        router.replace(book.newEntryHref);
      }
    }
    onChange(next as VoucherEntryType);
  }

  return (
    <Select value={value} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Select entry book" />
      </SelectTrigger>
      <SelectContent>
        {ENTRY_BOOKS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
