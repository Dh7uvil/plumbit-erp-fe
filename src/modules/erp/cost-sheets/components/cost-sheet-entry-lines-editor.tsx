"use client";

import { Plus, Trash2 } from "lucide-react";
import type { KeyboardEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { AccountPicker } from "@/modules/erp/accounting/accounts/components/account-picker";
import { journalBalanceTotals } from "@/modules/erp/accounting/journals/balance";
import {
  emptyCostSheetEntryLine,
  type CostSheetEntryFormValues,
} from "@/modules/erp/cost-sheets/schemas";
import { DocumentViewTableContainer } from "@/shared/components/document/document-view-table-container";
import { TableActionTooltip } from "@/shared/components/data-table/row-actions";
import { DecimalInput } from "@/shared/components/form/decimal-input";
import { Button } from "@/shared/components/ui/button";
import { FormControl, FormField, FormItem, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatFixedDecimal, formatReportMoney } from "@/shared/lib/format";

function formatTotalAmount(value: string, currencyCode?: string | null): string {
  return currencyCode ? formatReportMoney(value, currencyCode) : formatFixedDecimal(value);
}

function isBlankLine(line: CostSheetEntryFormValues["journal_lines"][number]): boolean {
  return (
    (!line.account_id || line.account_id === OPTIONAL_SELECT_NONE) &&
    !line.debit.trim() &&
    !line.credit.trim() &&
    !line.description.trim()
  );
}

export function CostSheetEntryLinesEditor({
  form,
  disabled,
  currencyCode,
}: {
  form: UseFormReturn<CostSheetEntryFormValues>;
  disabled?: boolean;
  currencyCode?: string | null;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "journal_lines",
  });
  const lines = useWatch({ control: form.control, name: "journal_lines" }) ?? [];
  const totals = journalBalanceTotals(
    lines.map((line) => ({
      debit: line.debit.trim() || "0",
      credit: line.credit.trim() || "0",
    })),
  );

  function onLastFieldKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (disabled) {
      return;
    }
    if (event.key === "Enter" && index === fields.length - 1) {
      event.preventDefault();
      append(emptyCostSheetEntryLine());
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <DocumentViewTableContainer viewMode={Boolean(disabled)} rowCount={fields.length}>
        <table className="w-full caption-bottom text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[20ch]">Account</TableHead>
              <TableHead className="w-32">Dr amount</TableHead>
              <TableHead className="w-32">Cr amount</TableHead>
              <TableHead>Description</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={field.id}>
                <TableCell className="min-w-[20ch] align-top">
                  <FormField
                    control={form.control}
                    name={`journal_lines.${index}.account_id`}
                    render={({ field: accountField }) => (
                      <FormItem>
                        <AccountPicker
                          subAccountsOnly
                          value={accountField.value}
                          onValueChange={accountField.onChange}
                          disabled={disabled}
                          asFormControl={false}
                          placeholder="Account"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell className="w-32 align-top">
                  <FormField
                    control={form.control}
                    name={`journal_lines.${index}.debit`}
                    render={({ field: debitField }) => (
                      <FormItem>
                        <FormControl>
                          <DecimalInput
                            kind="money"
                            disabled={disabled}
                            aria-label={`Line ${index + 1} debit`}
                            {...debitField}
                            onChange={(event) => {
                              debitField.onChange(event);
                              if (event.target.value.trim()) {
                                form.setValue(`journal_lines.${index}.credit`, "");
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell className="w-32 align-top">
                  <FormField
                    control={form.control}
                    name={`journal_lines.${index}.credit`}
                    render={({ field: creditField }) => (
                      <FormItem>
                        <FormControl>
                          <DecimalInput
                            kind="money"
                            disabled={disabled}
                            aria-label={`Line ${index + 1} credit`}
                            {...creditField}
                            onChange={(event) => {
                              creditField.onChange(event);
                              if (event.target.value.trim()) {
                                form.setValue(`journal_lines.${index}.debit`, "");
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell className="min-w-[16rem] align-top">
                  <FormField
                    control={form.control}
                    name={`journal_lines.${index}.description`}
                    render={({ field: descriptionField }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            disabled={disabled}
                            aria-label={`Line ${index + 1} description`}
                            {...descriptionField}
                            onKeyDown={(event) => onLastFieldKeyDown(index, event)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell className="align-top">
                  {disabled ? null : (
                    <TableActionTooltip label={`Remove line ${index + 1}`}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={`Remove line ${index + 1}`}
                        disabled={fields.length <= 1}
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableActionTooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-medium">Total amount</TableCell>
              <TableCell className="font-medium">
                {formatTotalAmount(totals.totalDebit, currencyCode)}
              </TableCell>
              <TableCell className="font-medium">
                {formatTotalAmount(totals.totalCredit, currencyCode)}
              </TableCell>
              <TableCell colSpan={2} className="text-muted-foreground text-xs">
                {totals.isBalanced
                  ? "Balanced"
                  : `Difference ${formatTotalAmount(totals.difference, currencyCode)} (post requires a match)`}
              </TableCell>
            </TableRow>
          </TableBody>
        </table>
      </DocumentViewTableContainer>
      {disabled ? null : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => append(emptyCostSheetEntryLine())}
        >
          <Plus className="size-3.5" />
          Add line
        </Button>
      )}
    </div>
  );
}

export function filledCostSheetEntryLines(
  lines: CostSheetEntryFormValues["journal_lines"],
): CostSheetEntryFormValues["journal_lines"] {
  return lines.filter((line) => !isBlankLine(line));
}
