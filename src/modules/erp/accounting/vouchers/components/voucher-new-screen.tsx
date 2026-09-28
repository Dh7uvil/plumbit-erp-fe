"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { JournalForm } from "@/modules/erp/accounting/journals/components/journal-form";
import { EntryBookSelect } from "@/modules/erp/accounting/vouchers/components/entry-book-select";
import { VoucherForm } from "@/modules/erp/accounting/vouchers/components/voucher-form";
import {
  JOURNAL_ENTRY_BOOK,
  VOUCHER_ENTRY_BOOK_LABELS,
  parseVoucherEntryBook,
  vouchersListHref,
} from "@/modules/erp/accounting/vouchers/schemas";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";

export function VoucherNewScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entryBook = parseVoucherEntryBook(searchParams.get("voucher_type"));
  const isJournal = entryBook === JOURNAL_ENTRY_BOOK;

  const subtitle = isJournal ? "Journal Voucher" : VOUCHER_ENTRY_BOOK_LABELS[entryBook];
  const backHref = isJournal ? "/vouchers?tab=journal" : vouchersListHref(entryBook);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Voucher entry"
        subtitle={subtitle}
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={backHref}>Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Voucher entry</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {isJournal ? (
            <div className="grid grid-cols-1 gap-x-3 gap-y-2 border-b pb-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label>Entry book</Label>
                <EntryBookSelect
                  value={entryBook}
                  onChange={(nextType) => {
                    router.replace(`/vouchers/new?voucher_type=${nextType}`);
                  }}
                />
              </div>
            </div>
          ) : null}
          {isJournal ? (
            <JournalForm journal={null} />
          ) : (
            <VoucherForm voucher={null} voucherType={entryBook} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
