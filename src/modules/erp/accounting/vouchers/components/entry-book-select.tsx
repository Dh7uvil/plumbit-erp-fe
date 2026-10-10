"use client";

import { useRouter } from "next/navigation";

import { useEntryBooks } from "@/modules/erp/accounting/entry-books/queries";
import { ENTRY_BOOKS, entryBooksFromApi } from "@/modules/erp/accounting/vouchers/entry-books";
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
  const entryBooksQuery = useEntryBooks();
  const books = entryBooksQuery.data?.length
    ? entryBooksFromApi(entryBooksQuery.data)
    : ENTRY_BOOKS;

  function handleValueChange(next: string) {
    if (navigateOnChange) {
      const book = books.find((row) => row.value === next);
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
        {books.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
