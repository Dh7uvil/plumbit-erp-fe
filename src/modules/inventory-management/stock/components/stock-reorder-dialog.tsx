"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useUpdateStockReorder } from "@/modules/inventory-management/stock/mutations";
import {
  StockReorderFormSchema,
  type StockBalance,
  type StockReorderFormValues,
} from "@/modules/inventory-management/stock/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { applyFieldErrors } from "@/shared/lib/form-errors";

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function StockReorderDialog({
  balance,
  open,
  onOpenChange,
}: {
  balance: StockBalance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateReorder = useUpdateStockReorder();
  const form = useForm<StockReorderFormValues>({
    resolver: zodResolver(StockReorderFormSchema),
    defaultValues: { reorder_level: "", reorder_qty: "" },
  });

  useEffect(() => {
    if (!open || !balance) {
      return;
    }
    form.reset({
      reorder_level: balance.reorder_level ?? "",
      reorder_qty: balance.reorder_qty ?? "",
    });
  }, [balance, form, open]);

  async function onSubmit(values: StockReorderFormValues) {
    if (!balance) {
      return;
    }
    try {
      await updateReorder.mutateAsync({
        balanceId: balance.id,
        values: {
          reorder_level: emptyToNull(values.reorder_level),
          reorder_qty: emptyToNull(values.reorder_qty),
        },
      });
      toast.success("Reorder levels saved");
      onOpenChange(false);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reorder levels</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <p className="text-muted-foreground text-sm">
              {balance ? `${balance.sku} · ${balance.warehouse_code}` : null}
            </p>
            <FormField
              control={form.control}
              name="reorder_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reorder level</FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reorder_qty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reorder quantity</FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateReorder.isPending}>
                {updateReorder.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
