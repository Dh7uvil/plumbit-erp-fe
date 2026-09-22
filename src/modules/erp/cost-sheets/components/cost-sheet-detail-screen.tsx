"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useAllCustomers } from "@/modules/crm/customers/queries";
import { useActiveChargeTypes } from "@/modules/erp/accounting/charge-types/queries";
import { CostSheetForm } from "@/modules/erp/cost-sheets/components/cost-sheet-form";
import { useCostSheetWorkflow } from "@/modules/erp/cost-sheets/hooks/use-cost-sheet-workflow";
import { useCostSheet } from "@/modules/erp/cost-sheets/queries";
import {
  COST_SHEET_STATUS_LABELS,
  COST_SHEET_TYPE_LABELS,
  type CostSheet,
} from "@/modules/erp/cost-sheets/schemas";
import {
  COST_SHEET_ACTION_REGISTRY,
  type CostSheetWorkflowAction,
} from "@/modules/erp/cost-sheets/workflow";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { LANDED_COST_ALLOCATION_METHOD_LABELS } from "@/modules/erp/landed-costs/schemas";
import { useProformaInvoice } from "@/modules/erp/proforma-invoices/queries";
import { proformaInvoiceDisplayNumber } from "@/modules/erp/proforma-invoices/schemas";
import { usePurchaseOrder } from "@/modules/erp/purchase-orders/queries";
import { purchaseOrderDisplayNumber } from "@/modules/erp/purchase-orders/schemas";
import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import { useAllProducts } from "@/modules/inventory-management/products/queries";
import { useShipment } from "@/modules/inventory-management/shipments/queries";
import { shipmentDisplayNumber } from "@/modules/inventory-management/shipments/schemas";
import { DocumentWorkflowButtons } from "@/shared/components/document/document-workflow-buttons";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatDate, formatReportMoney } from "@/shared/lib/format";

type Props = {
  id: string;
};

function CostSheetDetailContent({ sheet }: { sheet: CostSheet }) {
  const onAction = useCostSheetWorkflow(sheet);
  const currenciesQuery = useAllCurrencies();
  const productsQuery = useAllProducts();
  const chargeTypesQuery = useActiveChargeTypes();
  const suppliersQuery = useAllSuppliers();
  const customersQuery = useAllCustomers();
  const shipmentQuery = useShipment(sheet.shipment_id);
  const purchaseOrderQuery = usePurchaseOrder(sheet.purchase_order_id);
  const proformaQuery = useProformaInvoice(sheet.proforma_invoice_id);

  const currencyCode =
    currenciesQuery.data?.find((currency) => currency.id === sheet.currency_id)?.code ?? null;
  const productById = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of productsQuery.data ?? []) {
      map.set(product.id, `${product.sku} — ${product.name}`);
    }
    return map;
  }, [productsQuery.data]);
  const chargeTypeById = useMemo(() => {
    const map = new Map<string, string>();
    for (const charge of chargeTypesQuery.data ?? []) {
      map.set(charge.id, charge.name);
    }
    return map;
  }, [chargeTypesQuery.data]);
  const supplierName =
    sheet.supplier_id != null
      ? (suppliersQuery.data?.find((row) => row.id === sheet.supplier_id)?.name ?? null)
      : null;
  const customerName =
    sheet.customer_id != null
      ? (customersQuery.data?.find((row) => row.id === sheet.customer_id)?.name ?? null)
      : null;
  const shipmentLabel =
    shipmentQuery.data != null
      ? (shipmentDisplayNumber(shipmentQuery.data) ?? shipmentQuery.data.document_number)
      : null;
  const purchaseOrderLabel =
    purchaseOrderQuery.data != null
      ? (purchaseOrderDisplayNumber(purchaseOrderQuery.data) ??
        purchaseOrderQuery.data.document_number)
      : null;
  const proformaLabel =
    proformaQuery.data != null
      ? (proformaInvoiceDisplayNumber(proformaQuery.data) ?? proformaQuery.data.document_number)
      : null;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={sheet.document_number}
        subtitle={`${COST_SHEET_TYPE_LABELS[sheet.sheet_type]} cost sheet · ${formatDate(
          sheet.document_date,
        )}${currencyCode ? ` · ${currencyCode}` : ""}`}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/cost-sheets">Back</Link>
            </Button>
            <DocumentWorkflowButtons
              availableActions={sheet.available_actions}
              registry={COST_SHEET_ACTION_REGISTRY}
              documentKind="cost sheet"
              documentLabel={sheet.document_number}
              onAction={(action, extras) => onAction(action as CostSheetWorkflowAction, extras)}
            />
          </>
        }
      />
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{COST_SHEET_STATUS_LABELS[sheet.status]}</Badge>
        {sheet.landed_cost_id ? (
          <Button variant="link" size="sm" className="h-auto px-0" asChild>
            <Link href={`/landed-costs/${sheet.landed_cost_id}`}>View landed cost</Link>
          </Button>
        ) : null}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Header</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-3">
          {supplierName ? <div>Supplier: {supplierName}</div> : null}
          {customerName ? <div>Customer: {customerName}</div> : null}
          {shipmentLabel && sheet.shipment_id ? (
            <div>
              Shipment:{" "}
              <Link className="underline-offset-2 hover:underline" href={`/shipments/${sheet.shipment_id}`}>
                {shipmentLabel}
              </Link>
            </div>
          ) : null}
          {purchaseOrderLabel && sheet.purchase_order_id ? (
            <div>
              Purchase order:{" "}
              <Link
                className="underline-offset-2 hover:underline"
                href={`/purchase-orders/${sheet.purchase_order_id}`}
              >
                {purchaseOrderLabel}
              </Link>
            </div>
          ) : null}
          {proformaLabel && sheet.proforma_invoice_id ? (
            <div>
              Proforma:{" "}
              <Link
                className="underline-offset-2 hover:underline"
                href={`/proforma-invoices/${sheet.proforma_invoice_id}`}
              >
                {proformaLabel}
              </Link>
            </div>
          ) : null}
          <div>
            Allocation: {LANDED_COST_ALLOCATION_METHOD_LABELS[sheet.allocation_method]}
          </div>
          {sheet.incoterm ? <div>Incoterm: {sheet.incoterm}</div> : null}
          {sheet.port_of_loading ? <div>Port of loading: {sheet.port_of_loading}</div> : null}
          {sheet.port_of_discharge ? (
            <div>Port of discharge: {sheet.port_of_discharge}</div>
          ) : null}
          {sheet.notes ? <div className="md:col-span-3">Notes: {sheet.notes}</div> : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Totals (from server)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-3">
          <div>Goods value: {formatReportMoney(sheet.totals.goods_value_estimated)}</div>
          <div>
            Inventoriable charges (est.):{" "}
            {formatReportMoney(sheet.totals.inventoriable_charges_estimated)}
          </div>
          <div>
            Weighted landed unit (est.):{" "}
            {sheet.totals.weighted_landed_unit_cost_estimated
              ? formatReportMoney(sheet.totals.weighted_landed_unit_cost_estimated)
              : "—"}
          </div>
          {sheet.totals.cif_total ? (
            <div>CIF total: {formatReportMoney(sheet.totals.cif_total)}</div>
          ) : null}
          {sheet.totals.sheet_expected_margin_pct ? (
            <div>Sheet margin: {sheet.totals.sheet_expected_margin_pct}%</div>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lines</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Base rate</TableHead>
                <TableHead>Est. landed unit</TableHead>
                <TableHead>Actual landed unit</TableHead>
                <TableHead>Margin %</TableHead>
                <TableHead>GRN line</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sheet.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    {productById.get(line.product_id) ?? line.product_id.slice(0, 8)}
                  </TableCell>
                  <TableCell>{line.quantity}</TableCell>
                  <TableCell>{formatReportMoney(line.base_rate)}</TableCell>
                  <TableCell>{formatReportMoney(line.estimated_landed_unit_cost)}</TableCell>
                  <TableCell>
                    {line.actual_landed_unit_cost
                      ? formatReportMoney(line.actual_landed_unit_cost)
                      : "—"}
                  </TableCell>
                  <TableCell>{line.expected_margin_pct ?? "—"}</TableCell>
                  <TableCell>
                    {line.goods_receipt_line_id
                      ? line.goods_receipt_line_id.slice(0, 8) + "…"
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {sheet.charges.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Charges</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Charge</TableHead>
                  <TableHead>Estimated</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Inventoriable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sheet.charges.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell>
                      {chargeTypeById.get(charge.charge_type_id) ??
                        charge.charge_type_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>{formatReportMoney(charge.estimated_amount)}</TableCell>
                    <TableCell>
                      {charge.actual_amount ? formatReportMoney(charge.actual_amount) : "—"}
                    </TableCell>
                    <TableCell>
                      {charge.variance_amount ? formatReportMoney(charge.variance_amount) : "—"}
                    </TableCell>
                    <TableCell>{charge.is_inventoriable ? "Yes" : "No"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
      {sheet.status === "DRAFT" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit</CardTitle>
          </CardHeader>
          <CardContent>
            <CostSheetForm sheet={sheet} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function CostSheetDetailScreen({ id }: Props) {
  const query = useCostSheet(id);

  if (query.isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }
  if (!query.data) {
    return <p className="text-muted-foreground text-sm">Cost sheet not found.</p>;
  }

  return <CostSheetDetailContent sheet={query.data} />;
}
