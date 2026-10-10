"use client";

import { Plus, Trash2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { journalBalanceTotals } from "@/modules/erp/accounting/journals/balance";
import { AccountPicker } from "@/modules/erp/accounting/accounts/components/account-picker";
import { useAllCustomers } from "@/modules/crm/customers/queries";
import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import { MasterSelect } from "@/shared/components/form/master-select";
import { DecimalInput } from "@/shared/components/form/decimal-input";
import { Button } from "@/shared/components/ui/button";
import { FormControl, FormField, FormItem, FormMessage } from "@/shared/components/ui/form";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatReportMoney } from "@/shared/lib/format";
import type { CostSheetFormValues } from "@/modules/erp/cost-sheets/components/cost-sheet-form";

const LINE_KINDS = [
  { value: "G", label: "Ledger (G)" },
  { value: "S", label: "Supplier (S)" },
  { value: "C", label: "Customer (C)" },
] as const;

function emptyJournalLine(): CostSheetFormValues["journal_lines"][number] {
  return {
    line_kind: "G",
    account_id: OPTIONAL_SELECT_NONE,
    party_id: OPTIONAL_SELECT_NONE,
    debit: "0",
    credit: "0",
    description: "",
    capitalize: true,
  };
}

export function CostSheetJournalLinesEditor({
  form,
  disabled,
}: {
  form: UseFormReturn<CostSheetFormValues>;
  disabled?: boolean;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "journal_lines",
  });
  const lines = useWatch({ control: form.control, name: "journal_lines" }) ?? [];
  const customers = useAllCustomers().data ?? [];
  const suppliers = useAllSuppliers().data ?? [];
  const { totalDebit, totalCredit, difference } = journalBalanceTotals(
    lines.map((line) => ({
      debit: line.debit ?? "0",
      credit: line.credit ?? "0",
    })),
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Journal lines</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => append(emptyJournalLine())}
        >
          <Plus className="size-3.5" />
          Add line
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kind</TableHead>
            <TableHead>Account / party</TableHead>
            <TableHead className="text-right">Debit</TableHead>
            <TableHead className="text-right">Credit</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Capitalize</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field, index) => {
            const kind = lines[index]?.line_kind ?? "G";
            return (
              <TableRow key={field.id}>
                <TableCell className="align-top">
                  <FormField
                    control={form.control}
                    name={`journal_lines.${index}.line_kind`}
                    render={({ field: kindField }) => (
                      <FormItem>
                        <Select
                          value={kindField.value}
                          onValueChange={kindField.onChange}
                          disabled={disabled}
                        >
                          <FormControl>
                            <SelectTrigger className="w-28">
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
                <TableCell className="align-top">
                  {kind === "G" ? (
                    <FormField
                      control={form.control}
                      name={`journal_lines.${index}.account_id`}
                      render={({ field: accountField }) => (
                        <FormItem>
                          <AccountPicker
                            value={accountField.value}
                            onValueChange={accountField.onChange}
                            disabled={disabled}
                            placeholder="Account"
                          />
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
                <TableCell className="align-top">
                  <FormField
                    control={form.control}
                    name={`journal_lines.${index}.debit`}
                    render={({ field: debitField }) => (
                      <DecimalInput
                        kind="money"
                        className="text-right"
                        disabled={disabled}
                        {...debitField}
                      />
                    )}
                  />
                </TableCell>
                <TableCell className="align-top">
                  <FormField
                    control={form.control}
                    name={`journal_lines.${index}.credit`}
                    render={({ field: creditField }) => (
                      <DecimalInput
                        kind="money"
                        className="text-right"
                        disabled={disabled}
                        {...creditField}
                      />
                    )}
                  />
                </TableCell>
                <TableCell className="align-top">
                  <FormField
                    control={form.control}
                    name={`journal_lines.${index}.description`}
                    render={({ field: descField }) => (
                      <Input disabled={disabled} {...descField} />
                    )}
                  />
                </TableCell>
                <TableCell className="align-top">
                  <FormField
                    control={form.control}
                    name={`journal_lines.${index}.capitalize`}
                    render={({ field: capField }) => (
                      <FormItem className="flex items-center pt-2">
                        <FormControl>
                          <Checkbox
                            checked={capField.value}
                            onCheckedChange={capField.onChange}
                            disabled={disabled || kind !== "G"}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell className="align-top">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled || fields.length <= 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <p className="text-muted-foreground text-xs tabular-nums">
        Dr {formatReportMoney(totalDebit)} · Cr {formatReportMoney(totalCredit)} · Diff{" "}
        {formatReportMoney(difference)}
      </p>
    </div>
  );
}

export { emptyJournalLine };
