"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { productsApi } from "@/modules/inventory-management/products/api";
import { useAllProducts } from "@/modules/inventory-management/products/queries";
import { productPermissions } from "@/modules/inventory-management/products/permissions";
import { getErrorMessage } from "@/shared/api/errors";
import { DecimalInput } from "@/shared/components/form/decimal-input";
import { ListPage } from "@/shared/components/layout/list-page";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatDecimal } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

type DraftRow = {
  selling_rate: string;
  price_1: string;
  price_2: string;
  purchase_rate: string;
};

export function PriceMasterScreen() {
  const can = useCan();
  const productsQuery = useAllProducts(can(productPermissions.read));
  const products = productsQuery.data ?? [];
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Record<string, DraftRow>>({});
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const token = search.trim().toLowerCase();
    if (!token) {
      return products;
    }
    return products.filter(
      (p) => p.sku.toLowerCase().includes(token) || p.name.toLowerCase().includes(token),
    );
  }, [products, search]);

  function rowValues(productId: string, product: (typeof products)[number]): DraftRow {
    return (
      draft[productId] ?? {
        selling_rate: product.selling_rate,
        price_1: product.price_1 ?? "0",
        price_2: product.price_2 ?? "0",
        purchase_rate: product.purchase_rate,
      }
    );
  }

  async function saveAll() {
    const items = Object.entries(draft).map(([id, values]) => ({ id, ...values }));
    if (items.length === 0) {
      return;
    }
    setSaving(true);
    try {
      await productsApi.bulkUpdatePrices(items);
      toast.success("Prices updated");
      setDraft({});
      await productsQuery.refetch();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ListPage
      title="Price master"
      subtitle="Bulk edit default, price 1, price 2, and cost."
      actions={
        can(productPermissions.update) ? (
          <Button disabled={saving || Object.keys(draft).length === 0} onClick={() => void saveAll()}>
            Save changes
          </Button>
        ) : null
      }
    >
      <Input
        placeholder="Search by item code or name"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-md"
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Def. sale</TableHead>
              <TableHead>Price 1</TableHead>
              <TableHead>Price 2</TableHead>
              <TableHead>Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((product) => {
              const values = rowValues(product.id, product);
              const setField = (field: keyof DraftRow, value: string) => {
                setDraft((prev) => ({
                  ...prev,
                  [product.id]: { ...values, [field]: value },
                }));
              };
              return (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  {(["selling_rate", "price_1", "price_2", "purchase_rate"] as const).map(
                    (field) => (
                      <TableCell key={field}>
                        {can(productPermissions.update) ? (
                          <DecimalInput
                            kind="money"
                            className="h-8"
                            value={values[field]}
                            onChange={(event) => setField(field, event.target.value)}
                          />
                        ) : (
                          <span className="tabular-nums">{formatDecimal(values[field])}</span>
                        )}
                      </TableCell>
                    ),
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </ListPage>
  );
}
