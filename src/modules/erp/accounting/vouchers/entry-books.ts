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
  GENERAL_PURCHASE: "journal",
  PAYMENT_VOUCHER: "bank-payment",
};

const SERIES_PREFIX: Record<VoucherEntryType, string> = {
  CASH_RECEIPT: "CR",
  CASH_PAYMENT: "CP",
  BANK_RECEIPT: "BR",
  BANK_PAYMENT: "BP",
  JOURNAL: "JV",
  GENERAL_PURCHASE: "GP",
  PAYMENT_VOUCHER: "PV",
};

function configForType(
  type: VoucherEntryType,
  overrides?: Partial<Pick<EntryBookConfig, "label" | "seriesPrefix">>,
): EntryBookConfig {
  return {
    value: type,
    label: overrides?.label ?? VOUCHER_ENTRY_BOOK_LABELS[type],
    tab: TAB_BY_TYPE[type],
    seriesPrefix: overrides?.seriesPrefix ?? SERIES_PREFIX[type],
    requiresCheque: type.startsWith("BANK") || type === "PAYMENT_VOUCHER",
    paymentSubtype: type.startsWith("CASH")
      ? "CASH"
      : type.startsWith("BANK") || type === "PAYMENT_VOUCHER"
        ? "BANK"
        : null,
    usesDrCrGrid: type === "JOURNAL" || type === "GENERAL_PURCHASE",
    newEntryHref: `/vouchers/entry?voucher_type=${type}`,
  };
}

export const ENTRY_BOOKS: EntryBookConfig[] = VOUCHER_ENTRY_TYPES.map((type) =>
  configForType(type),
);

/** Merge API entry book master rows onto static defaults (series + display name). */
export function entryBooksFromApi(
  rows: Array<{ voucher_type: string; name: string; series_prefix: string; is_active: boolean }>,
): EntryBookConfig[] {
  const byType = new Map(rows.map((row) => [row.voucher_type, row]));
  return VOUCHER_ENTRY_TYPES.filter((type) => {
    const remote = byType.get(type);
    return remote?.is_active !== false;
  }).map((type) => {
    const remote = byType.get(type);
    if (!remote) {
      return configForType(type);
    }
    return configForType(type, {
      label: remote.name,
      seriesPrefix: remote.series_prefix,
    });
  });
}

export function requiresChequeForEntryType(type: VoucherEntryType): boolean {
  return entryBookFor(type).requiresCheque;
}

export function entryBookFor(type: VoucherEntryType): EntryBookConfig {
  const book = ENTRY_BOOKS.find((row) => row.value === type);
  if (!book) {
    throw new Error(`Unknown entry book: ${type}`);
  }
  return book;
}

export type EntryBookApiRow = {
  voucher_type: string;
  name: string;
  series_prefix: string;
  is_active: boolean;
};

export function resolveEntryBook(
  type: VoucherEntryType,
  apiRows?: EntryBookApiRow[] | null,
): EntryBookConfig {
  if (apiRows?.length) {
    const book = entryBooksFromApi(apiRows).find((row) => row.value === type);
    if (book) {
      return book;
    }
  }
  return entryBookFor(type);
}

export function entryBookOptions(includeJournal = true): EntryBookConfig[] {
  return includeJournal ? ENTRY_BOOKS : ENTRY_BOOKS.filter((book) => book.value !== "JOURNAL");
}
