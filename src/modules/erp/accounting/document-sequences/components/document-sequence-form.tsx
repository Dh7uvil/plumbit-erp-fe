"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  useCreateDocumentSequence,
  useUpdateDocumentSequence,
} from "@/modules/erp/accounting/document-sequences/mutations";
import {
  DOCUMENT_TYPES,
  DocumentSequenceFormSchema,
  type DocumentSequence,
  type DocumentSequenceCreateRequest,
  type DocumentSequenceFormValues,
} from "@/modules/erp/accounting/document-sequences/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
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
import { applyFieldErrors } from "@/shared/lib/form-errors";

function toFormValues(sequence: DocumentSequence | null): DocumentSequenceFormValues {
  return {
    document_type: sequence?.document_type ?? "QUOTATION",
    series: sequence?.series ?? "",
    fiscal_year: sequence?.fiscal_year ?? new Date().getFullYear(),
    prefix: sequence?.prefix ?? "",
    next_number: sequence?.next_number ?? 1,
    padding: sequence?.padding ?? 6,
    is_active: sequence?.is_active ?? true,
  };
}

function toCreateRequest(values: DocumentSequenceFormValues): DocumentSequenceCreateRequest {
  return {
    document_type: values.document_type,
    series: values.series.trim(),
    fiscal_year: values.fiscal_year,
    prefix: values.prefix.trim(),
    next_number: values.next_number,
    padding: values.padding,
  };
}

export function DocumentSequenceForm({
  sequence,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  sequence: DocumentSequence | null;
  disabled?: boolean;
  onSuccess?: (entity: { id: string }) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const createDocumentSequence = useCreateDocumentSequence();
  const updateDocumentSequence = useUpdateDocumentSequence();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(sequence);

  const form = useForm<DocumentSequenceFormValues>({
    resolver: zodResolver(DocumentSequenceFormSchema),
    values: toFormValues(sequence),
  });

  async function onSubmit(values: DocumentSequenceFormValues) {
    setFormError(null);
    try {
      if (sequence) {
        await updateDocumentSequence.mutateAsync({
          id: sequence.id,
          values: {
            prefix: values.prefix.trim(),
            next_number: values.next_number,
            padding: values.padding,
            is_active: values.is_active,
          },
        });
        toast.success("Document sequence updated");
        onSuccess?.(sequence);
      } else {
        const created = await createDocumentSequence.mutateAsync(toCreateRequest(values));
        toast.success("Document sequence created");
        onSuccess?.(created);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createDocumentSequence.isPending || updateDocumentSequence.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={disabled ? (event) => event.preventDefault() : form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="document_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isEdit || disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="series"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Series</FormLabel>
                <FormControl>
                  <Input placeholder="Q" disabled={isEdit || disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fiscal_year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={2000}
                    max={2100}
                    disabled={isEdit || disabled}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="prefix"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prefix</FormLabel>
                <FormControl>
                  <Input placeholder="QT" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="next_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Next number</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value}
                    disabled={disabled}
                    onChange={(event) => field.onChange(event.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="padding"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Padding</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value}
                    disabled={disabled}
                    onChange={(event) => field.onChange(event.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isEdit ? (
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="col-span-full flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      disabled={disabled}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <FormLabel>Active</FormLabel>
                </FormItem>
              )}
            />
          ) : null}
        </div>
        {showCancel || !disabled ? (
          <div className="flex justify-end gap-2">
            {showCancel ? (
              <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
                {disabled ? "Close" : "Cancel"}
              </Button>
            ) : null}
            {!disabled ? (
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                {isEdit ? "Save Changes" : "Create Document Sequence"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </form>
    </Form>
  );
}
