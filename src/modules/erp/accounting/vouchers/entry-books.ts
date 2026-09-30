import {
  VOUCHER_ENTRY_BOOK_LABELS,
  VOUCHER_ENTRY_TYPES,
  type VoucherEntryType,
  type VoucherWorkspaceTab,
} from "@/modules/erp/accounting/vouchers/schemas";

export type EntryBookConfig = {
  value: VoucherEntryType;
  label: string;
  tab: VoucherWorkspaceTab;
  seriesPrefix: string;
  requiresCheque: boolean;
  paymentSubtype: "CASH" | "BANK" | null;
  usesDrCrGrid: boolean;
  newEntryHref: string;
};

const TAB_BY_TYPE: Record<VoucherEntryType, VoucherWorkspaceTab> = {
  CASH_RECEIPT: "cash-receipt",
  CASH_PAYMENT: "cash-payment",
  BANK_RECEIPT: "bank-receipt",
  BANK_PAYMENT: "bank-payment",
  JOURNAL: "journal",
};

const SERIES_PREFIX: Record<VoucherEntryType, string> = {
  CASH_RECEIPT: "CRV",
  CASH_PAYMENT: "CPV",
  BANK_RECEIPT: "BRV",
  BANK_PAYMENT: "BPV",
  JOURNAL: "JV",
};

export const ENTRY_BOOKS: EntryBookConfig[] = VOUCHER_ENTRY_TYPES.map((type) => ({
  value: type,
  label: VOUCHER_ENTRY_BOOK_LABELS[type],
  tab: TAB_BY_TYPE[type],
  seriesPrefix: SERIES_PREFIX[type],
  requiresCheque: type.startsWith("BANK"),
  paymentSubtype: type.startsWith("CASH") ? "CASH" : type.startsWith("BANK") ? "BANK" : null,
  usesDrCrGrid: type === "JOURNAL",
  newEntryHref: `/vouchers/entry?voucher_type=${type}`,
}));

export function entryBookFor(type: VoucherEntryType): EntryBookConfig {
  const book = ENTRY_BOOKS.find((row) => row.value === type);
  if (!book) {
    throw new Error(`Unknown entry book: ${type}`);
  }
  return book;
}

export function entryBookOptions(includeJournal = true): EntryBookConfig[] {
  return includeJournal ? ENTRY_BOOKS : ENTRY_BOOKS.filter((book) => book.value !== "JOURNAL");
}
