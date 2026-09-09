"use client";

import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";

import {
  PAYMENT_MILESTONE_TRIGGER_LABELS,
  PAYMENT_MILESTONE_TRIGGERS,
  milestoneTotals,
  parseDecimal,
  type MilestoneMode,
  type ProformaInvoiceFormValues,
} from "@/modules/erp/proforma-invoices/schemas";
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
import { formatDecimal } from "@/shared/lib/format";

export function MilestonesEditor({
  form,
  disabled,
  grandTotal,
}: {
  form: UseFormReturn<ProformaInvoiceFormValues>;
  disabled?: boolean;
  grandTotal?: string;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "milestones",
  });
  const milestones = useWatch({ control: form.control, name: "milestones" }) ?? [];
  const totals = milestoneTotals(milestones);
  const percentOff =
    totals.mode === "percent" && totals.percentSum !== null
      ? Math.abs(totals.percentSum - 100) > 0.0001
      : false;
  const amountOff =
    totals.mode === "amount" && totals.amountSum !== null && parseDecimal(grandTotal ?? "") !== null
      ? Math.abs(totals.amountSum - (parseDecimal(grandTotal ?? "") ?? 0)) > 0.0001
      : false;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Payment milestones</p>
        {!disabled ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                sequence: String(fields.length + 1),
                label: "",
                trigger: "ON_CONFIRMATION",
                mode: (totals.mode ?? "percent") as MilestoneMode,
                value: "",
                net_days: "",
                due_date: "",
                notes: "",
              })
            }
          >
            <Plus className="size-3.5" />
            Add milestone
          </Button>
        ) : null}
      </div>
      {totals.mixed ? (
        <p className="text-destructive text-sm">Use percent or amount on every milestone, not both.</p>
      ) : null}
      {percentOff ? (
        <p className="text-destructive text-sm">
          Percentages currently sum to {formatDecimal(String(totals.percentSum))} and must total 100.
        </p>
      ) : null}
      {amountOff ? (
        <p className="text-destructive text-sm">
          Amounts currently sum to {formatDecimal(String(totals.amountSum))} and must equal the grand
          total.
        </p>
      ) : null}
      {!totals.mixed && totals.mode === "percent" && !percentOff && totals.percentSum !== null ? (
        <p className="text-muted-foreground text-sm">
          Running total {formatDecimal(String(totals.percentSum))}% of 100%.
        </p>
      ) : null}
      {!totals.mixed && totals.mode === "amount" && totals.amountSum !== null ? (
        <p className="text-muted-foreground text-sm">
          Running total {formatDecimal(String(totals.amountSum))}
          {grandTotal ? ` of ${formatDecimal(grandTotal)}` : ""}.
        </p>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Seq</TableHead>
              <TableHead>Label</TableHead>
              <TableHead className="w-44">Trigger</TableHead>
              <TableHead className="w-28">Mode</TableHead>
              <TableHead className="w-28">Value</TableHead>
              <TableHead className="w-24">Net days</TableHead>
              <TableHead className="w-36">Due date</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => {
              const trigger = milestones[index]?.trigger;
              return (
                <TableRow key={field.id}>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`milestones.${index}.sequence`}
                      render={({ field: seqField }) => (
                        <FormItem>
                          <FormControl>
                            <Input disabled={disabled} {...seqField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`milestones.${index}.label`}
                      render={({ field: labelField }) => (
                        <FormItem>
                          <FormControl>
                            <Input disabled={disabled} {...labelField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`milestones.${index}.trigger`}
                      render={({ field: triggerField }) => (
                        <FormItem>
                          <Select
                            value={triggerField.value}
                            onValueChange={triggerField.onChange}
                            disabled={disabled}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Trigger" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PAYMENT_MILESTONE_TRIGGERS.map((item) => (
                                <SelectItem key={item} value={item}>
                                  {PAYMENT_MILESTONE_TRIGGER_LABELS[item]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`milestones.${index}.mode`}
                      render={({ field: modeField }) => (
                        <FormItem>
                          <Select
                            value={modeField.value}
                            onValueChange={modeField.onChange}
                            disabled={disabled}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="percent">Percent</SelectItem>
                              <SelectItem value="amount">Amount</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`milestones.${index}.value`}
                      render={({ field: valueField }) => (
                        <FormItem>
                          <FormControl>
                            <Input inputMode="decimal" disabled={disabled} {...valueField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    {trigger === "NET_DAYS" ? (
                      <FormField
                        control={form.control}
                        name={`milestones.${index}.net_days`}
                        render={({ field: daysField }) => (
                          <FormItem>
                            <FormControl>
                              <Input inputMode="numeric" disabled={disabled} {...daysField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`milestones.${index}.due_date`}
                      render={({ field: dueField }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="date" disabled={disabled} {...dueField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`milestones.${index}.notes`}
                      render={({ field: notesField }) => (
                        <FormItem>
                          <FormControl>
                            <Input disabled={disabled} {...notesField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    {!disabled && fields.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label="Remove milestone"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </table>
      </div>
    </div>
  );
}
