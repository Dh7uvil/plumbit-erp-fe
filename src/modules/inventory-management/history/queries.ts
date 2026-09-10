"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { customersApi } from "@/modules/crm/customers/api";
import { suppliersApi } from "@/modules/erp/suppliers/api";
import type { TradingHistoryListParams } from "@/modules/inventory-management/history/schemas";
import { productsApi } from "@/modules/inventory-management/products/api";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const historyKeys = {
  all: ["trading-history"] as const,
  productCustomers: (productId: string) =>
    [...historyKeys.all, "product-customers", productId] as const,
  productSales: (productId: string, params: TradingHistoryListParams) =>
    [...historyKeys.all, "product-sales", productId, params] as const,
  productPurchases: (productId: string, params: TradingHistoryListParams) =>
    [...historyKeys.all, "product-purchases", productId, params] as const,
  customerProducts: (customerId: string) =>
    [...historyKeys.all, "customer-products", customerId] as const,
  customerSales: (customerId: string, params: TradingHistoryListParams) =>
    [...historyKeys.all, "customer-sales", customerId, params] as const,
  supplierPurchases: (supplierId: string, params: TradingHistoryListParams) =>
    [...historyKeys.all, "supplier-purchases", supplierId, params] as const,
};

export function useProductCustomers(productId: string, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(historyKeys.productCustomers(productId)),
    queryFn: () => productsApi.listCustomers(productId),
    enabled: Boolean(productId) && enabled,
  });
}

export function useProductSalesHistory(
  productId: string,
  params: TradingHistoryListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: useTenantQueryKey(historyKeys.productSales(productId, params)),
    queryFn: () => productsApi.listSalesHistory(productId, params),
    placeholderData: keepPreviousData,
    enabled: Boolean(productId) && enabled,
  });
}

export function useProductPurchaseHistory(
  productId: string,
  params: TradingHistoryListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: useTenantQueryKey(historyKeys.productPurchases(productId, params)),
    queryFn: () => productsApi.listPurchaseHistory(productId, params),
    placeholderData: keepPreviousData,
    enabled: Boolean(productId) && enabled,
  });
}

export function useCustomerProducts(customerId: string, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(historyKeys.customerProducts(customerId)),
    queryFn: () => customersApi.listProducts(customerId),
    enabled: Boolean(customerId) && enabled,
  });
}

export function useCustomerSalesHistory(
  customerId: string,
  params: TradingHistoryListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: useTenantQueryKey(historyKeys.customerSales(customerId, params)),
    queryFn: () => customersApi.listSalesHistory(customerId, params),
    placeholderData: keepPreviousData,
    enabled: Boolean(customerId) && enabled,
  });
}

export function useSupplierPurchaseHistory(
  supplierId: string,
  params: TradingHistoryListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: useTenantQueryKey(historyKeys.supplierPurchases(supplierId, params)),
    queryFn: () => suppliersApi.listPurchaseHistory(supplierId, params),
    placeholderData: keepPreviousData,
    enabled: Boolean(supplierId) && enabled,
  });
}
