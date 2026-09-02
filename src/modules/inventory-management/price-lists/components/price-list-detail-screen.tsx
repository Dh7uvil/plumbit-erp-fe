"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import {
  useDeletePriceListItem,
  useUpdatePriceList,
  useUpsertPriceListItem,
} from "@/modules/inventory-management/price-lists/mutations";
import { priceListPermissions } from "@/modules/inventory-management/price-lists/permissions";
import { usePriceList } from "@/modules/inventory-management/price-lists/queries";
import {
  PRICE_LIST_TYPE_LABELS,
  PriceListEditFormSchema,
  type PriceListEditFormValues,
  type PriceListItem,
} from "@/modules/inventory-management/price-lists/schemas";
import { useAllProducts } from "@/modules/inventory-management/products/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTable } from "@/shared/components/data-table/data-table";
import { tableHeaders } from "@/shared/components/data-table/row-actions";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import {
  RecordPageHeader,
  type RecordPageMode,
} from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { formatMoney } from "@/shared/lib/format";

const ITEM_COLUMNS = ["Product", "Rate"] as const;

export function PriceListDetailScreen({
  priceListId,
  mode,
}: {
  priceListId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(priceListPermissions);
  const priceListQuery = usePriceList(priceListId);
  const isEdit = mode === "edit";
  const viewHref = `/price-lists/${priceListId}`;
  const currenciesQuery = useAllCurrencies();
  const productsQuery = useAllProducts();
  const updatePriceList = useUpdatePriceList();
  const upsertItem = useUpsertPriceListItem();
  const deleteItem = useDeletePriceListItem();
  const [formError, setFormError] = useState<string | null>(null);
  const [itemError, setItemError] = useState<string | null>(null);
  const [productId, setProductId] = useState(OPTIONAL_SELECT_NONE);
  const [rate, setRate] = useState("");
  const [deletingItem, setDeletingItem] = useState<PriceListItem | null>(null);

  const priceList = priceListQuery.data;
  const currencies = currenciesQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const currency = currencies.find((item) => item.id === priceList?.currency_id);
  const productNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of productsQuery.data ?? []) {
      map.set(product.id, product.name);
    }
    return map;
  }, [productsQuery.data]);

  const form = useForm<PriceListEditFormValues>({
    resolver: zodResolver(PriceListEditFormSchema),
    values: {
      name: priceList?.name ?? "",
      percent: priceList?.percent ?? "",
      is_active: priceList?.is_active ?? true,
    },
  });
  useDirtyFormGuard(isEdit && form.formState.isDirty);

  const items = priceList?.items ?? [];
  const itemHeaders = tableHeaders(ITEM_COLUMNS, isEdit);
  const assignedProductIds = new Set(items.map((item) => item.product_id));
  const availableProducts = products.filter((product) => !assignedProductIds.has(product.id));

  async function onSubmit(values: PriceListEditFormValues) {
    if (!priceList) {
      return;
    }
    if (priceList.list_type === "PERCENT" && !values.percent.trim()) {
      form.setError("percent", { type: "manual", message: "Enter a percent" });
      return;
    }
    setFormError(null);
    try {
      await updatePriceList.mutateAsync({
        id: priceList.id,
        values: {
          name: values.name.trim(),
          percent: priceList.list_type === "PERCENT" ? values.percent.trim() : null,
          is_active: values.is_active,
        },
      });
      toast.success("Price list updated");
      router.push(viewHref);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  async function onAddItem() {
    if (!priceList || productId === OPTIONAL_SELECT_NONE || !rate.trim()) {
      setItemError("Select a product and enter a rate");
      return;
    }
    setItemError(null);
    try {
      await upsertItem.mutateAsync({
        id: priceList.id,
        values: { product_id: productId, rate: rate.trim() },
      });
      toast.success("Item added");
      setProductId(OPTIONAL_SELECT_NONE);
      setRate("");
    } catch (error) {
      setItemError(getErrorMessage(error));
    }
  }

  async function confirmDeleteItem() {
    if (!priceList || !deletingItem) {
      return;
    }
    try {
      await deleteItem.mutateAsync({ id: priceList.id, productId: deletingItem.product_id });
      toast.success("Item deleted");
      setDeletingItem(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (priceListQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (priceListQuery.isError || !priceList) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={
            priceListQuery.error ? getErrorMessage(priceListQuery.error) : "Price list not found"
          }
          onRetry={() => priceListQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/price-lists">Back to price lists</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={priceList.name}
        subtitle={PRICE_LIST_TYPE_LABELS[priceList.list_type]}
        listHref="/price-lists"
        viewHref={viewHref}
        editHref={`${viewHref}/edit`}
        canUpdate={canUpdate}
        mode={mode}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isEdit ? "Edit price list" : "Price list"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
              {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem
                      className={priceList.list_type !== "PERCENT" ? "sm:col-span-2" : undefined}
                    >
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input maxLength={150} disabled={!isEdit} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {priceList.list_type === "PERCENT" ? (
                  <FormField
                    control={form.control}
                    name="percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Percent</FormLabel>
                        <FormControl>
                          <Input inputMode="decimal" disabled={!isEdit} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Input value={currency ? `${currency.code} — ${currency.name}` : "—"} disabled />
                </FormItem>
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Input value={PRICE_LIST_TYPE_LABELS[priceList.list_type]} disabled />
                </FormItem>
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="col-span-full flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          disabled={!isEdit}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                      </FormControl>
                      <FormLabel>Active</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              {isEdit ? (
                <div className="flex justify-end">
                  <Button type="submit" disabled={updatePriceList.isPending}>
                    {updatePriceList.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                    Save Changes
                  </Button>
                </div>
              ) : null}
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {isEdit ? (
            <div className="flex flex-col gap-2">
              {itemError ? <p className="text-destructive text-sm">{itemError}</p> : null}
              <div className="flex flex-wrap items-end gap-2">
                <div className="w-64">
                  <p className="mb-1.5 text-sm font-medium">Product</p>
                  <Select value={productId} onValueChange={setProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={OPTIONAL_SELECT_NONE}>Select a product</SelectItem>
                      {availableProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.sku} — {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-36">
                  <p className="mb-1.5 text-sm font-medium">Rate</p>
                  <Input
                    inputMode="decimal"
                    value={rate}
                    onChange={(event) => setRate(event.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={upsertItem.isPending}
                  onClick={() => void onAddItem()}
                >
                  {upsertItem.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Plus className="size-3.5" />
                  )}
                  Add item
                </Button>
              </div>
            </div>
          ) : null}
          <DataTable>
            <TableHeader>
              <TableRow>
                {itemHeaders.map((header) => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={itemHeaders.length}>
                    <DataTableEmpty
                      title="No items"
                      message={emptyListMessage(isEdit, "Add a product rate to this list.")}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {productNameById.get(item.product_id) ?? "—"}
                    </TableCell>
                    <TableCell>{currency ? formatMoney(item.rate, currency.code) : "—"}</TableCell>
                    {isEdit ? (
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive size-7"
                          aria-label="Delete item"
                          onClick={() => setDeletingItem(item)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              )}
            </TableBody>
          </DataTable>
        </CardContent>
      </Card>
      <ConfirmActionDialog
        open={Boolean(deletingItem)}
        title="Delete item"
        description="Remove this product from the price list?"
        confirmLabel="Delete"
        pending={deleteItem.isPending}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        onConfirm={() => void confirmDeleteItem()}
      />
    </div>
  );
}
