"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { JournalsScreen } from "@/modules/erp/accounting/journals/components/journals-screen";
import { journalPermissions } from "@/modules/erp/accounting/journals/permissions";
import { VouchersScreen } from "@/modules/erp/accounting/vouchers/components/vouchers-screen";
import { voucherPermissions } from "@/modules/erp/accounting/vouchers/permissions";
import {
  parseVoucherWorkspaceTab,
  voucherTypeForTab,
  type VoucherWorkspaceTab,
} from "@/modules/erp/accounting/vouchers/schemas";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useCan } from "@/shared/providers/session-provider";

export function VouchersWorkspaceScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = parseVoucherWorkspaceTab(searchParams.get("tab"));
  const can = useCan();
  const { canCreate } = useCrudPermissions(voucherPermissions);
  const { canCreate: canCreateJournal } = useCrudPermissions(journalPermissions);
  const voucherType = voucherTypeForTab(tab);

  function setTab(next: VoucherWorkspaceTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "cash-receipt") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    params.delete("page");
    params.delete("party_id");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const actions =
    tab === "journal" && canCreateJournal ? (
      <Button type="button" size="sm" asChild>
        <Link href="/journals/new">
          <Plus className="size-3.5" />
          New journal
        </Link>
      </Button>
    ) : tab !== "journal" && canCreate && voucherType ? (
      <Button type="button" size="sm" asChild>
        <Link href={`/vouchers/new?voucher_type=${voucherType}`}>
          <Plus className="size-3.5" />
          Voucher entry
        </Link>
      </Button>
    ) : undefined;

  return (
    <ListPage>
      <PageHeader
        title="Vouchers"
        subtitle="Cash and bank receipts, payments, and journal vouchers"
        actions={actions}
      />
      <Tabs value={tab} onValueChange={(value) => setTab(value as VoucherWorkspaceTab)}>
        <TabsList>
          <TabsTrigger value="cash-receipt">Cash receipt</TabsTrigger>
          <TabsTrigger value="cash-payment">Cash payment</TabsTrigger>
          <TabsTrigger value="bank-receipt">Bank receipt</TabsTrigger>
          <TabsTrigger value="bank-payment">Bank payment</TabsTrigger>
          {can(journalPermissions.read) ? (
            <TabsTrigger value="journal">Journal voucher</TabsTrigger>
          ) : null}
        </TabsList>
        <TabsContent value="cash-receipt" className="mt-4">
          <VouchersScreen embedded voucherType="CASH_RECEIPT" />
        </TabsContent>
        <TabsContent value="cash-payment" className="mt-4">
          <VouchersScreen embedded voucherType="CASH_PAYMENT" />
        </TabsContent>
        <TabsContent value="bank-receipt" className="mt-4">
          <VouchersScreen embedded voucherType="BANK_RECEIPT" />
        </TabsContent>
        <TabsContent value="bank-payment" className="mt-4">
          <VouchersScreen embedded voucherType="BANK_PAYMENT" />
        </TabsContent>
        {can(journalPermissions.read) ? (
          <TabsContent value="journal" className="mt-4">
            <JournalsScreen embedded />
          </TabsContent>
        ) : null}
      </Tabs>
    </ListPage>
  );
}
