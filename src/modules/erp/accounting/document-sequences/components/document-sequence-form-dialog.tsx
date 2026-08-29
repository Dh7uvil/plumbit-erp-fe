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

export function DocumentSequenceFormDialog({
  open,
  sequence,
  onOpenChange,
}: {
  open: boolean;
  sequence: DocumentSequence | null;
  onOpenChange: (open: boolean) => void;
}) {
  const createDocumentSequence = useCreateDocumentSequence();
  const updateDocumentSequence = useUpdateDocumentSequence();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(sequence);

  const form = useForm<DocumentSequenceFormValues>({
    resolver: zodResolver(DocumentSequenceFormSchema),
    values: toFormValues(sequence),
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      setFormError(null);
    }
    onOpenChange(next);
  }

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
      } else {
        await createDocumentSequence.mutateAsync(toCreateRequest(values));
        toast.success("Document sequence created");
      }
      handleOpenChange(false);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createDocumentSequence.isPending || updateDocumentSequence.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Document Sequence" : "New Document Sequence"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
            {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="document_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isEdit}
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
                      <Input placeholder="Q" disabled={isEdit} {...field} />
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
                        disabled={isEdit}
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
                      <Input placeholder="QT" {...field} />
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
                    <FormItem className="flex flex-row items-center gap-2 space-y-0 sm:col-span-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                      </FormControl>
                      <FormLabel>Active</FormLabel>
                    </FormItem>
                  )}
                />
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                {isEdit ? "Save Changes" : "Create Document Sequence"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
