"use client";

import { Plus, Trash2 } from "lucide-react";
import type { KeyboardEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { AccountPicker } from "@/modules/erp/accounting/accounts/components/account-picker";
import { useAllCustomers } from "@/modules/crm/customers/queries";
import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import { journalBalanceTotals } from "@/modules/erp/accounting/journals/balance";
import { MasterSelect } from "@/shared/components/form/master-select";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatFixedDecimal, formatReportMoney } from "@/shared/lib/format";

const LINE_KINDS = [
  { value: "G", label: "G" },
  { value: "S", label: "S" },
  { value: "C", label: "C" },
] as const;

function formatTotalAmount(value: string, currencyCode?: string | null): string {
  return currencyCode ? formatReportMoney(value, currencyCode) : formatFixedDecimal(value);
}

function isBlankLine(line: CostSheetEntryFormValues["journal_lines"][number]): boolean {
  const noAccount = !line.account_id || line.account_id === OPTIONAL_SELECT_NONE;
  const noParty = !line.party_id || line.party_id === OPTIONAL_SELECT_NONE;
  const noTarget = line.line_kind === "G" ? noAccount : noParty;
  return noTarget && !line.debit.trim() && !line.credit.trim() && !line.description.trim();
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
  const customers = useAllCustomers().data ?? [];
  const suppliers = useAllSuppliers().data ?? [];
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
          <colgroup>
            <col className="w-14" />
            <col />
            <col className="w-32" />
            <col className="w-32" />
            <col />
            <col className="w-12" />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14 pr-2">Kind</TableHead>
              <TableHead className="min-w-0">Account / party</TableHead>
              <TableHead className="w-32">Dr amount</TableHead>
              <TableHead className="w-32">Cr amount</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => {
              const kind = lines[index]?.line_kind ?? "G";
              return (
              <TableRow key={field.id}>
                <TableCell className="w-14 max-w-14 align-top pr-2">
                  <FormField
                    control={form.control}
                    name={`journal_lines.${index}.line_kind`}
                    render={({ field: kindField }) => (
                      <FormItem className="space-y-0">
                        <Select
                          value={kindField.value}
                          onValueChange={kindField.onChange}
                          disabled={disabled}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9 w-14 max-w-full shrink-0 px-2">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LINE_KINDS.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell className="min-w-0 overflow-hidden align-top pl-0">
                  {kind === "G" ? (
                    <FormField
                      control={form.control}
                      name={`journal_lines.${index}.account_id`}
                      render={({ field: accountField }) => (
                        <FormItem className="min-w-0">
                          <div className="min-w-0 max-w-full">
                            <AccountPicker
                              subAccountsOnly
                              value={accountField.value}
                              onValueChange={accountField.onChange}
                              disabled={disabled}
                              asFormControl={false}
                              placeholder="Account"
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name={`journal_lines.${index}.party_id`}
                      render={({ field: partyField }) => (
                        <FormItem>
                          <MasterSelect
                            value={partyField.value}
                            onValueChange={partyField.onChange}
                            disabled={disabled}
                            placeholder="Party"
                            searchPlaceholder="Search…"
                            options={[
                              { value: OPTIONAL_SELECT_NONE, label: "Select party" },
                              ...(kind === "S" ? suppliers : customers).map((party) => ({
                                value: party.id,
                                label: party.name,
                              })),
                            ]}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
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
                <TableCell className="overflow-hidden align-top">
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
                <TableCell className="w-12 align-top">
                  {disabled ? null : (
                    <TableActionTooltip label={`Remove line ${index + 1}`}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive size-7"
                        aria-label={`Remove line ${index + 1}`}
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableActionTooltip>
                  )}
                </TableCell>
              </TableRow>
            );
            })}
            <TableRow>
              <TableCell colSpan={2} className="font-medium">
                Total amount
              </TableCell>
              <TableCell className="font-medium">
                {formatTotalAmount(totals.totalDebit, currencyCode)}
              </TableCell>
              <TableCell className="font-medium">
                {formatTotalAmount(totals.totalCredit, currencyCode)}
              </TableCell>
              <TableCell colSpan={2} className="text-muted-foreground text-xs">
                {totals.isBalanced
                  ? "Balanced"
                  : `Difference ${formatTotalAmount(totals.difference, currencyCode)}`}
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
