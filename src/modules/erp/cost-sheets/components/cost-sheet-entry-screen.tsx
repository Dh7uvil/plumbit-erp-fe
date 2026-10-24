"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  CostSheetEntryLinesEditor,
  filledCostSheetEntryLines,
} from "@/modules/erp/cost-sheets/components/cost-sheet-entry-lines-editor";
import { useCreateCostSheet, useUpdateCostSheet } from "@/modules/erp/cost-sheets/mutations";
import {
  CostSheetEntryFormSchema,
  emptyCostSheetEntryLine,
  type CostSheet,
  type CostSheetCreateRequest,
  type CostSheetEntryFormValues,
  type CostSheetUpdateRequest,
} from "@/modules/erp/cost-sheets/schemas";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { documentTypeDisplayLabel } from "@/shared/components/document/document-links";
import { SourceDocumentPicker } from "@/shared/components/document/source-document-picker";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
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
import { Textarea } from "@/shared/components/ui/textarea";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useBaseCurrency } from "@/shared/hooks/use-base-currency";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { fiscalPeriodForIsoDate } from "@/shared/lib/fiscal-period";

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function toFormValues(sheet: CostSheet | null): CostSheetEntryFormValues {
  if (!sheet) {
    const documentDate = todayIsoDate();
    return {
      source_document_type: OPTIONAL_SELECT_NONE,
      source_document_id: OPTIONAL_SELECT_NONE,
      document_date: documentDate,
      period: fiscalPeriodForIsoDate(documentDate),
      imp_reference: "",
      notes: "",
      journal_lines: [emptyCostSheetEntryLine(), emptyCostSheetEntryLine()],
    };
  }

  const journalLines =
    sheet.journal_lines.length > 0
      ? sheet.journal_lines.map((line) => ({
          account_id: line.account_id ?? OPTIONAL_SELECT_NONE,
          debit: line.debit === "0" || line.debit === "0.0000" ? "" : line.debit,
          credit: line.credit === "0" || line.credit === "0.0000" ? "" : line.credit,
          description: line.description ?? "",
        }))
      : [emptyCostSheetEntryLine(), emptyCostSheetEntryLine()];

  return {
    source_document_type: sheet.source_document_type ?? OPTIONAL_SELECT_NONE,
    source_document_id: sheet.source_document_id ?? OPTIONAL_SELECT_NONE,
    document_date: sheet.document_date,
    period: sheet.period ?? fiscalPeriodForIsoDate(sheet.document_date),
    imp_reference: sheet.imp_reference ?? "",
    notes: sheet.notes ?? "",
    journal_lines: journalLines,
  };
}

function toCreatePayload(values: CostSheetEntryFormValues): CostSheetCreateRequest {
  const lines = filledCostSheetEntryLines(values.journal_lines);
  return {
    sheet_type: "IMPORT",
    sheet_mode: "JOURNAL",
    source_document_type: values.source_document_type,
    source_document_id: values.source_document_id,
    document_date: values.document_date,
    fiscal_period: values.period,
    imp_reference: emptyToNull(values.imp_reference) ?? undefined,
    notes: emptyToNull(values.notes) ?? undefined,
    journal_lines: lines.map((line) => ({
      line_kind: "G",
      account_id: line.account_id,
      debit: line.debit.trim() || "0",
      credit: line.credit.trim() || "0",
      description: emptyToNull(line.description) ?? undefined,
      capitalize: false,
    })),
  };
}

function toUpdatePayload(values: CostSheetEntryFormValues): CostSheetUpdateRequest {
  const created = toCreatePayload(values);
  return {
    source_document_type: created.source_document_type,
    source_document_id: created.source_document_id,
    document_date: created.document_date,
    fiscal_period: created.fiscal_period,
    imp_reference: created.imp_reference,
    notes: created.notes,
    sheet_mode: "JOURNAL",
    journal_lines: created.journal_lines,
  };
}

export function CostSheetEntryScreen({ sheet }: { sheet?: CostSheet | null }) {
  const router = useRouter();
  const isEdit = Boolean(sheet);
  const readOnly = Boolean(sheet && sheet.status !== "DRAFT");
  const createSheet = useCreateCostSheet();
  const updateSheet = useUpdateCostSheet(sheet?.id ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<CostSheetEntryFormValues>({
    resolver: zodResolver(CostSheetEntryFormSchema),
    defaultValues: toFormValues(sheet ?? null),
    values: sheet ? toFormValues(sheet) : undefined,
  });
  useDirtyFormGuard(form.formState.isDirty && !isEdit);

  const pending = createSheet.isPending || updateSheet.isPending;
  const { baseCurrencyCode } = useBaseCurrency();
  const currenciesQuery = useAllCurrencies();
  const currencyCode = useMemo(() => {
    if (sheet?.currency_id) {
      const match = currenciesQuery.data?.find((row) => row.id === sheet.currency_id);
      if (match?.code) {
        return match.code;
      }
    }
    return baseCurrencyCode ?? undefined;
  }, [baseCurrencyCode, currenciesQuery.data, sheet?.currency_id]);

  async function onSubmit(values: CostSheetEntryFormValues) {
    setFormError(null);
    const lines = filledCostSheetEntryLines(values.journal_lines);
    if (lines.length === 0) {
      setFormError("Add at least one Dr/Cr line.");
      return;
    }
    try {
      if (sheet) {
        await updateSheet.mutateAsync({
          values: toUpdatePayload({ ...values, journal_lines: lines }),
          options: { version: sheet.version },
        });
        toast.success("Cost sheet saved");
        router.push(`/cost-sheets/${sheet.id}`);
      } else {
        const created = await createSheet.mutateAsync(
          toCreatePayload({ ...values, journal_lines: lines }),
        );
        toast.success("Cost sheet created");
        router.push(`/cost-sheets/${created.id}/edit`);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={isEdit ? "Cost sheet entry" : "New cost sheet entry"}
        subtitle={
          sheet?.source_document_type
            ? documentTypeDisplayLabel(sheet.source_document_type)
            : "Journal cost sheet"
        }
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/cost-sheets">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cost sheet entry</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
              {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
              <div className="grid grid-cols-1 gap-x-3 gap-y-4 border-b pb-4 sm:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={form.control}
                  name="source_document_type"
                  render={({ field: typeField }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input {...typeField} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="source_document_id"
                  render={({ field: idField }) => (
                    <FormItem className="col-span-full grid grid-cols-1 gap-x-3 gap-y-4 sm:col-span-2 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-2">
                      <SourceDocumentPicker
                        documentType={form.watch("source_document_type")}
                        documentId={idField.value}
                        documentNumber={sheet?.source_document_number}
                        disabled={readOnly}
                        onDocumentTypeChange={(value) =>
                          form.setValue("source_document_type", value, { shouldDirty: true })
                        }
                        onDocumentIdChange={idField.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Voucher no.</FormLabel>
                  <FormControl>
                    <Input
                      value={sheet?.document_number ?? "Assigned on save"}
                      disabled
                      readOnly
                    />
                  </FormControl>
                </FormItem>
                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period</FormLabel>
                      <FormControl>
                        <Select
                          value={String(field.value)}
                          onValueChange={(value) => field.onChange(Number(value))}
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Period" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, index) => index + 1).map((period) => (
                              <SelectItem key={period} value={String(period)}>
                                {period}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="document_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" disabled={readOnly} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imp_reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IMP reference</FormLabel>
                      <FormControl>
                        <Input disabled={readOnly} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea disabled={readOnly} rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <CostSheetEntryLinesEditor
                form={form}
                disabled={readOnly}
                currencyCode={currencyCode}
              />
              {readOnly ? null : (
                <div className="flex justify-end">
                  <Button type="submit" disabled={pending}>
                    {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                    {isEdit ? "Save cost sheet" : "Create cost sheet"}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
