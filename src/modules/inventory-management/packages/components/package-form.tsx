"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { useDeliveryNotes } from "@/modules/inventory-management/delivery-notes/queries";
import { deliveryNoteDisplayNumber } from "@/modules/inventory-management/delivery-notes/schemas";
import { useSalesOrderPackableLines, useSalesOrders } from "@/modules/erp/sales-orders/queries";
import { salesOrderDisplayNumber } from "@/modules/erp/sales-orders/schemas";
import {
  useCreatePackage,
  useUpdatePackage,
} from "@/modules/inventory-management/packages/mutations";
import {
  PackageFormSchema,
  emptyPackageLine,
  isBlankPackageLine,
  type Package,
  type PackageCreateRequest,
  type PackageFormValues,
  type PackageLineInput,
  type PackageUpdateRequest,
} from "@/modules/inventory-management/packages/schemas";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";
import { packingFromLine, packingLineInput } from "@/shared/components/document/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { formatDecimal } from "@/shared/lib/format";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";

function todayPlaceholder(): string {
  return "";
}

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function toLineInput(line: PackageFormValues["lines"][number]): PackageLineInput {
  return {
    sales_order_line_id: line.sales_order_line_id,
    product_id: optionalUuid(line.product_id),
    quantity: line.quantity,
    unit_id: optionalUuid(line.unit_id),
    ...packingLineInput(line),
  };
}

function toFormValues(pkg: Package | null, salesOrderId?: string, deliveryNoteId?: string): PackageFormValues {
  const lines = pkg?.lines ?? [];
  return {
    sales_order_id: pkg?.sales_order_id ?? salesOrderId ?? OPTIONAL_SELECT_NONE,
    delivery_note_id: pkg?.delivery_note_id ?? deliveryNoteId ?? OPTIONAL_SELECT_NONE,
    package_number: pkg?.package_number ?? "",
    length: pkg?.length ?? "",
    width: pkg?.width ?? "",
    height: pkg?.height ?? "",
    dimension_unit: pkg?.dimension_unit ?? "cm",
    gross_weight: pkg?.gross_weight ?? "",
    net_weight: pkg?.net_weight ?? "",
    weight_unit: pkg?.weight_unit ?? "kg",
    shipping_marks: pkg?.shipping_marks ?? "",
    notes: pkg?.notes ?? "",
    lines:
      lines.length === 0
        ? [emptyPackageLine()]
        : lines.map((line) => ({
            sales_order_line_id: line.sales_order_line_id,
            product_id: line.product_id ?? OPTIONAL_SELECT_NONE,
            description: todayPlaceholder(),
            quantity: line.quantity,
            outstanding: line.quantity,
            unit_id: line.unit_id ?? OPTIONAL_SELECT_NONE,
            ...packingFromLine(line),
          })),
  };
}

export function PackageForm({
  pkg,
  salesOrderId,
  deliveryNoteId,
  disabled = false,
  onSuccess,
}: {
  pkg: Package | null;
  salesOrderId?: string;
  deliveryNoteId?: string;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const createPackage = useCreatePackage();
  const updatePackage = useUpdatePackage();
  const salesOrdersQuery = useSalesOrders({ status: "CONFIRMED", page_size: 100 });
  const form = useForm<PackageFormValues>({
    resolver: zodResolver(PackageFormSchema),
    defaultValues: toFormValues(pkg, salesOrderId, deliveryNoteId),
  });
  const pending = createPackage.isPending || updatePackage.isPending;
  useDirtyFormGuard(!disabled && form.formState.isDirty);
  const watchedOrderId = useWatch({ control: form.control, name: "sales_order_id" });
  const packableQuery = useSalesOrderPackableLines(
    optionalUuid(watchedOrderId),
    !pkg && Boolean(optionalUuid(watchedOrderId)),
  );
  const notesQuery = useDeliveryNotes(
    { sales_order_id: optionalUuid(watchedOrderId) ?? undefined, page_size: 100 },
    Boolean(optionalUuid(watchedOrderId)),
  );
  const { fields } = useFieldArray({ control: form.control, name: "lines" });
  const watchedLines = useWatch({ control: form.control, name: "lines" });

  useEffect(() => {
    form.reset(toFormValues(pkg, salesOrderId, deliveryNoteId));
  }, [deliveryNoteId, form, pkg, salesOrderId]);

  useEffect(() => {
    if (pkg || !packableQuery.data) {
      return;
    }
    const outstanding = packableQuery.data.filter((line) => Number(line.outstanding) > 0);
    form.setValue(
      "lines",
      outstanding.length === 0
        ? [emptyPackageLine()]
        : outstanding.map((line) => ({
            ...emptyPackageLine(),
            sales_order_line_id: line.sales_order_line_id,
            product_id: line.product_id ?? OPTIONAL_SELECT_NONE,
            description: line.description,
            quantity: line.outstanding,
            outstanding: line.outstanding,
            unit_id: line.unit_id ?? OPTIONAL_SELECT_NONE,
          })),
    );
  }, [form, packableQuery.data, pkg]);

  async function onSubmit(values: PackageFormValues) {
    const lines = values.lines.filter((line) => !isBlankPackageLine(line)).map(toLineInput);
    const payload = {
      delivery_note_id: optionalUuid(values.delivery_note_id),
      package_number: emptyToNull(values.package_number),
      length: emptyToNull(values.length),
      width: emptyToNull(values.width),
      height: emptyToNull(values.height),
      dimension_unit: emptyToNull(values.dimension_unit),
      gross_weight: emptyToNull(values.gross_weight),
      net_weight: emptyToNull(values.net_weight),
      weight_unit: emptyToNull(values.weight_unit),
      shipping_marks: emptyToNull(values.shipping_marks),
      notes: emptyToNull(values.notes),
      lines,
    };
    try {
      if (pkg) {
        const update: PackageUpdateRequest = payload;
        await updatePackage.mutateAsync({ id: pkg.id, values: update, version: pkg.version });
        toast.success("Package saved");
        onSuccess?.();
      } else {
        const create: PackageCreateRequest = { ...payload, sales_order_id: values.sales_order_id };
        const created = await createPackage.mutateAsync(create);
        toast.success("Package created");
        router.push(`/packages/${created.id}`);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      toast.error(getErrorMessage(error));
    }
  }

  const salesOrders = salesOrdersQuery.data?.data ?? [];
  const deliveryNotes = notesQuery.data?.data ?? [];

  return (
    <Form {...form}>
      <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="sales_order_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sales order</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || Boolean(pkg)}
                  placeholder="Select sales order"
                  searchPlaceholder="Search sales order…"
                  options={salesOrders.map((order) => ({
                    value: order.id,
                    label: salesOrderDisplayNumber(order) ?? order.id,
                  }))}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="delivery_note_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery note</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled}
                  placeholder="Unattached"
                  searchPlaceholder="Search delivery note…"
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "Unattached" },
                    ...deliveryNotes.map((note) => ({
                      value: note.id,
                      label: deliveryNoteDisplayNumber(note) ?? note.id,
                    })),
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="package_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carton number</FormLabel>
                <FormControl>
                  <Input disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dimension_unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dimension unit</FormLabel>
                <FormControl>
                  <Input disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Length</FormLabel>
                <FormControl>
                  <Input disabled={disabled} inputMode="decimal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="width"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Width</FormLabel>
                <FormControl>
                  <Input disabled={disabled} inputMode="decimal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Height</FormLabel>
                <FormControl>
                  <Input disabled={disabled} inputMode="decimal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="weight_unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight unit</FormLabel>
                <FormControl>
                  <Input disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gross_weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gross weight</FormLabel>
                <FormControl>
                  <Input disabled={disabled} inputMode="decimal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="net_weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Net weight</FormLabel>
                <FormControl>
                  <Input disabled={disabled} inputMode="decimal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="shipping_marks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shipping marks</FormLabel>
              <FormControl>
                <Input disabled={disabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea disabled={disabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="w-32">Qty</TableHead>
                <TableHead className="w-28">Item code</TableHead>
                <TableHead className="w-24">PKG</TableHead>
                <TableHead className="w-24">Ctns</TableHead>
                <TableHead className="w-24">CBM</TableHead>
                <TableHead className="w-24">Weight</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>{watchedLines?.[index]?.description || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatDecimal(watchedLines?.[index]?.outstanding || "0")}
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`lines.${index}.quantity`}
                      render={({ field: qtyField }) => (
                        <FormItem>
                          <FormControl>
                            <Input disabled={disabled} inputMode="decimal" {...qtyField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  {(
                    [
                      ["item_code", "Item code"],
                      ["packing_unit", "PKG"],
                      ["carton_qty", "Ctns"],
                      ["cbm", "CBM"],
                      ["weight", "Weight"],
                    ] as const
                  ).map(([name, label]) => (
                    <TableCell key={name}>
                      <FormField
                        control={form.control}
                        name={`lines.${index}.${name}`}
                        render={({ field: packingField }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                disabled={disabled}
                                aria-label={`Line ${index + 1} ${label}`}
                                {...packingField}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </table>
        </div>
        {disabled ? null : (
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {pkg ? "Save package" : "Create package"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
