"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PurchasesToBillPanel } from "@/modules/erp/purchases/components/purchases-to-bill-panel";
import {
  parsePurchaseWorkspaceTab,
  type PurchaseWorkspaceTab,
} from "@/modules/erp/purchases/schemas";
import { PurchaseInvoicesScreen } from "@/modules/erp/purchase-invoices/components/purchase-invoices-screen";
import { purchaseInvoicePermissions } from "@/modules/erp/purchase-invoices/permissions";
import { PurchaseOrdersScreen } from "@/modules/erp/purchase-orders/components/purchase-orders-screen";
import { purchaseOrderPermissions } from "@/modules/erp/purchase-orders/permissions";
import { goodsReceiptPermissions } from "@/modules/inventory-management/goods-receipts/permissions";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useCan } from "@/shared/providers/session-provider";

export function PurchasesWorkspaceScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = parsePurchaseWorkspaceTab(searchParams.get("tab"));
  const can = useCan();
  const { canCreate: canCreatePo } = useCrudPermissions(purchaseOrderPermissions);
  const { canCreate: canCreateBill } = useCrudPermissions(purchaseInvoicePermissions);
  const canSeeOrders = can(purchaseOrderPermissions.read);
  const canSeeBills = can(purchaseInvoicePermissions.read);
  const canSeeToBill =
    can(purchaseOrderPermissions.read) ||
    can(goodsReceiptPermissions.read) ||
    can(purchaseInvoicePermissions.read);

  function setTab(next: PurchaseWorkspaceTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "orders") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const actions =
    tab === "orders" && canCreatePo ? (
      <Button type="button" size="sm" asChild>
        <Link href="/purchase-orders/new">
          <Plus className="size-3.5" />
          New purchase order
        </Link>
      </Button>
    ) : tab === "bills" && canCreateBill ? (
      <Button type="button" size="sm" asChild>
        <Link href="/purchase-invoices/new">
          <Plus className="size-3.5" />
          New bill
        </Link>
      </Button>
    ) : undefined;

  return (
    <ListPage>
      <PageHeader
        title="Purchases"
        subtitle="Orders, bills, receiving and billing queues"
        actions={actions}
      />
      <Tabs value={tab} onValueChange={(value) => setTab(value as PurchaseWorkspaceTab)}>
        <TabsList>
          {canSeeOrders ? <TabsTrigger value="orders">Orders</TabsTrigger> : null}
          {canSeeBills ? <TabsTrigger value="bills">Bills</TabsTrigger> : null}
          {canSeeOrders ? <TabsTrigger value="to-receive">To receive</TabsTrigger> : null}
          {canSeeToBill ? <TabsTrigger value="to-bill">To bill</TabsTrigger> : null}
        </TabsList>
        {canSeeOrders ? (
          <TabsContent value="orders" className="mt-4">
            <PurchaseOrdersScreen embedded />
          </TabsContent>
        ) : null}
        {canSeeBills ? (
          <TabsContent value="bills" className="mt-4">
            <PurchaseInvoicesScreen embedded />
          </TabsContent>
        ) : null}
        {canSeeOrders ? (
          <TabsContent value="to-receive" className="mt-4">
            <PurchaseOrdersScreen embedded toReceiveOnly />
          </TabsContent>
        ) : null}
        {canSeeToBill ? (
          <TabsContent value="to-bill" className="mt-4">
            <PurchasesToBillPanel />
          </TabsContent>
        ) : null}
      </Tabs>
    </ListPage>
  );
}
