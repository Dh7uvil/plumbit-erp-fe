import { apiClient } from "@/shared/api/client";
import {
  CustomerDocumentComposeDefaultsSchema,
  CustomerPaymentComposeDefaultsSchema,
  ProductLineDefaultsSchema,
  SupplierDocumentComposeDefaultsSchema,
  SupplierPaymentComposeDefaultsSchema,
  type CustomerDocumentComposeDefaults,
  type CustomerPaymentComposeDefaults,
  type ProductLineDefaults,
  type SupplierDocumentComposeDefaults,
  type SupplierPaymentComposeDefaults,
} from "@/shared/api/party-compose-schemas";

async function customerDocumentCompose(path: string, customerId: string) {
  return CustomerDocumentComposeDefaultsSchema.parse(
    await apiClient.get(`${path}/compose-defaults`, { params: { customer_id: customerId } }),
  );
}

async function supplierDocumentCompose(path: string, supplierId: string) {
  return SupplierDocumentComposeDefaultsSchema.parse(
    await apiClient.get(`${path}/compose-defaults`, { params: { supplier_id: supplierId } }),
  );
}

export const partyComposeApi = {
  salesInvoice: (customerId: string): Promise<CustomerDocumentComposeDefaults> =>
    customerDocumentCompose("/sales-invoices", customerId),
  creditNote: (customerId: string): Promise<CustomerDocumentComposeDefaults> =>
    customerDocumentCompose("/credit-notes", customerId),
  deliveryNote: (customerId: string): Promise<CustomerDocumentComposeDefaults> =>
    customerDocumentCompose("/delivery-notes", customerId),
  salesReturn: (customerId: string): Promise<CustomerDocumentComposeDefaults> =>
    customerDocumentCompose("/sales-returns", customerId),
  purchaseInvoice: (supplierId: string): Promise<SupplierDocumentComposeDefaults> =>
    supplierDocumentCompose("/purchase-invoices", supplierId),
  debitNote: (supplierId: string): Promise<SupplierDocumentComposeDefaults> =>
    supplierDocumentCompose("/debit-notes", supplierId),
  goodsReceipt: (supplierId: string): Promise<SupplierDocumentComposeDefaults> =>
    supplierDocumentCompose("/goods-receipts", supplierId),
  purchaseReturn: (supplierId: string): Promise<SupplierDocumentComposeDefaults> =>
    supplierDocumentCompose("/purchase-returns", supplierId),
  shipment: (supplierId: string): Promise<SupplierDocumentComposeDefaults> =>
    supplierDocumentCompose("/shipments", supplierId),
  customerPayment: async (customerId: string): Promise<CustomerPaymentComposeDefaults> =>
    CustomerPaymentComposeDefaultsSchema.parse(
      await apiClient.get("/customer-payments/compose-defaults", {
        params: { customer_id: customerId },
      }),
    ),
  supplierPayment: async (supplierId: string): Promise<SupplierPaymentComposeDefaults> =>
    SupplierPaymentComposeDefaultsSchema.parse(
      await apiClient.get("/supplier-payments/compose-defaults", {
        params: { supplier_id: supplierId },
      }),
    ),
  productLineDefaults: async (
    productId: string,
    params: {
      warehouse_id?: string | null;
      price_list_id?: string | null;
      currency_id?: string | null;
      purchase_side?: boolean;
    } = {},
  ): Promise<ProductLineDefaults> =>
    ProductLineDefaultsSchema.parse(
      await apiClient.get(`/products/${productId}/line-defaults`, {
        params: {
          warehouse_id: params.warehouse_id ?? undefined,
          price_list_id: params.price_list_id ?? undefined,
          currency_id: params.currency_id ?? undefined,
          purchase_side: params.purchase_side ?? false,
        },
      }),
    ),
};
