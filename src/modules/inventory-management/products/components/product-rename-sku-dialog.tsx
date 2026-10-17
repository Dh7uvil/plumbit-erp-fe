"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useRenameProductSku } from "@/modules/inventory-management/products/mutations";
import type { Product } from "@/modules/inventory-management/products/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

export function ProductRenameSkuDialog({
  product,
  open,
  onOpenChange,
  onRenamed,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRenamed?: (product: Product) => void;
}) {
  const renameSku = useRenameProductSku();
  const [sku, setSku] = useState(product.sku);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    if (next) {
      setSku(product.sku);
      setError(null);
    }
    onOpenChange(next);
  }

  async function submit() {
    const trimmed = sku.trim().toUpperCase();
    if (!trimmed) {
      setError("Enter a new item code");
      return;
    }
    if (trimmed === product.sku) {
      setError("New code must differ from the current SKU");
      return;
    }
    setError(null);
    try {
      const updated = await renameSku.mutateAsync({ id: product.id, sku: trimmed });
      toast.success("Item code renamed");
      onRenamed?.(updated);
      handleOpenChange(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename item code</DialogTitle>
          <DialogDescription>
            Updates SKU for {product.name}. Stock, history, and documents keep the same product
            record; only the identifier changes (audited on the server).
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="rename-sku">New SKU / item code</Label>
          <Input
            id="rename-sku"
            value={sku}
            onChange={(event) => setSku(event.target.value.toUpperCase())}
            className="font-mono uppercase"
            autoComplete="off"
          />
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={renameSku.isPending} onClick={() => void submit()}>
            {renameSku.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
