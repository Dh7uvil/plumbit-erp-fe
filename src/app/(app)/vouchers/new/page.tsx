import { redirect } from "next/navigation";

import {
  parseVoucherEntryBook,
  type VoucherEntryType,
} from "@/modules/erp/accounting/vouchers/schemas";

export default function NewVoucherPage({
  searchParams,
}: {
  searchParams: { voucher_type?: string };
}) {
  const entryBook: VoucherEntryType = parseVoucherEntryBook(searchParams.voucher_type ?? null);
  redirect(`/vouchers/entry?voucher_type=${entryBook}`);
}
