"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState, type KeyboardEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useFieldArray } from "react-hook-form";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { accountPermissions } from "@/modules/erp/accounting/accounts/permissions";
import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import { isControlAccount, type Account } from "@/modules/erp/accounting/accounts/schemas";
import { AccountFormDialog } from "@/modules/erp/accounting/accounts/components/account-form-dialog";
import { emptyJournalLine } from "@/modules/erp/accounting/journals/schemas";
import type { JournalFormValues } from "@/modules/erp/accounting/journals/schemas";
import { journalBalanceTotals } from "@/modules/erp/accounting/journals/balance";
import { useAllCustomers } from "@/modules/crm/customers/queries";
import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import { customerPermissions } from "@/modules/crm/customers/permissions";
import { supplierPermissions } from "@/modules/erp/suppliers/permissions";
import { CustomerFormDialog } from "@/modules/crm/customers/components/customer-form-dialog";
import { SupplierFormDialog } from "@/modules/erp/suppliers/components/supplier-form-dialog";
import { MasterSelect } from "@/shared/components/form/master-select";
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
import { formatDecimal } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

function partyTypeFor(account: Account | undefined): "CUSTOMER" | "SUPPLIER" | null {
  if (!account || !isControlAccount(account)) {
    return null;
  }
  return account.account_subtype === "ACCOUNTS_RECEIVABLE" ? "CUSTOMER" : "SUPPLIER";
}

export function JournalLinesEditor({
  form,
  disabled,
}: {
  form: UseFormReturn<JournalFormValues>;
  disabled: boolean;
}) {
  const can = useCan();
  const accountsQuery = useAllAccounts({ is_group: false, is_active: true });
  const customersQuery = useAllCustomers();
  const suppliersQuery = useAllSuppliers();
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });
  const [creatingAccount, setCreatingAccount] = useState<number | null>(null);
  const [creatingParty, setCreatingParty] = useState<{
    type: "CUSTOMER" | "SUPPLIER";
    index: number;
  } | null>(null);
  const accounts = (accountsQuery.data ?? []).filter((account) => !account.is_group);
  const accountsById = useMemo(() => {
    const map = new Map<string, Account>();
    for (const account of accounts) {
      map.set(account.id, account);
    }
    return map;
  }, [accounts]);
  const customers = customersQuery.data ?? [];
  const suppliers = suppliersQuery.data ?? [];
  const watchedLines = form.watch("lines");
  const totals = journalBalanceTotals(watchedLines ?? []);

  function onLastFieldKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (disabled) {
      return;
    }
    if (event.key === "Enter" && index === fields.length - 1) {
      event.preventDefault();
      append(emptyJournalLine());
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full caption-bottom text-sm">
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Debit</TableHead>
              <TableHead>Credit</TableHead>
              <TableHead>Party</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Description</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => {
              const accountId = form.watch(`lines.${index}.account_id`);
              const account = accountsById.get(accountId);
              const partyType = partyTypeFor(account);
              const partyOptions =
                partyType === "CUSTOMER"
                  ? customers.map((row) => ({ value: row.id, label: row.name }))
                  : partyType === "SUPPLIER"
                    ? suppliers.map((row) => ({ value: row.id, label: row.name }))
                    : [];
              return (
                <TableRow key={field.id}>
                  <TableCell className="min-w-52 align-top">
                    <FormField
                      control={form.control}
                      name={`lines.${index}.account_id`}
                      render={({ field: accountField }) => (
                        <FormItem>
                          <FormControl>
                            <MasterSelect
                              compact
                              asFormControl={false}
                              value={accountField.value}
                              onValueChange={(value) => {
                                accountField.onChange(value);
                                const next = accountsById.get(value);
                                const nextParty = partyTypeFor(next);
                                form.setValue(
                                  `lines.${index}.party_type`,
                                  nextParty ?? OPTIONAL_SELECT_NONE,
                                );
                                if (!nextParty) {
                                  form.setValue(`lines.${index}.party_id`, OPTIONAL_SELECT_NONE);
                                  form.setValue(`lines.${index}.due_date`, "");
                                }
                              }}
                              disabled={disabled}
                              placeholder="Account"
                              searchPlaceholder="Search account…"
                              aria-label={`Line ${index + 1} account`}
                              createLabel="Create account"
                              onCreate={
                                can(accountPermissions.create)
                                  ? () => setCreatingAccount(index)
                                  : undefined
                              }
                              options={accounts.map((row) => ({
                                value: row.id,
                                label: `${row.code} — ${row.name}`,
                              }))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="min-w-28 align-top">
                    <FormField
                      control={form.control}
                      name={`lines.${index}.debit`}
                      render={({ field: debitField }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              inputMode="decimal"
                              disabled={disabled}
                              aria-label={`Line ${index + 1} debit`}
                              {...debitField}
                              onChange={(event) => {
                                debitField.onChange(event);
                                if (event.target.value.trim()) {
                                  form.setValue(`lines.${index}.credit`, "");
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="min-w-28 align-top">
                    <FormField
                      control={form.control}
                      name={`lines.${index}.credit`}
                      render={({ field: creditField }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              inputMode="decimal"
                              disabled={disabled}
                              aria-label={`Line ${index + 1} credit`}
                              {...creditField}
                              onChange={(event) => {
                                creditField.onChange(event);
                                if (event.target.value.trim()) {
                                  form.setValue(`lines.${index}.debit`, "");
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="min-w-44 align-top">
                    {partyType ? (
                      <FormField
                        control={form.control}
                        name={`lines.${index}.party_id`}
                        render={({ field: partyField }) => (
                          <FormItem>
                            <FormControl>
                              <MasterSelect
                                compact
                                asFormControl={false}
                                value={partyField.value}
                                onValueChange={partyField.onChange}
                                disabled={disabled}
                                placeholder={partyType === "CUSTOMER" ? "Customer" : "Supplier"}
                                searchPlaceholder="Search party…"
                                aria-label={`Line ${index + 1} party`}
                                createLabel={
                                  partyType === "CUSTOMER" ? "Create customer" : "Create supplier"
                                }
                                onCreate={
                                  (partyType === "CUSTOMER"
                                    ? can(customerPermissions.create)
                                    : can(supplierPermissions.create))
                                    ? () => setCreatingParty({ type: partyType, index })
                                    : undefined
                                }
                                options={partyOptions}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="min-w-36 align-top">
                    {partyType ? (
                      <FormField
                        control={form.control}
                        name={`lines.${index}.due_date`}
                        render={({ field: dueField }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="date"
                                disabled={disabled}
                                aria-label={`Line ${index + 1} due date`}
                                {...dueField}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="min-w-36 align-top">
                    <FormField
                      control={form.control}
                      name={`lines.${index}.external_reference`}
                      render={({ field: refField }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              disabled={disabled}
                              aria-label={`Line ${index + 1} reference`}
                              {...refField}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="min-w-44 align-top">
                    <FormField
                      control={form.control}
                      name={`lines.${index}.description`}
                      render={({ field: descField }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              disabled={disabled}
                              aria-label={`Line ${index + 1} description`}
                              {...descField}
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={`Remove line ${index + 1}`}
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell className="font-medium">Totals</TableCell>
              <TableCell className="font-medium">{formatDecimal(totals.totalDebit)}</TableCell>
              <TableCell className="font-medium">{formatDecimal(totals.totalCredit)}</TableCell>
              <TableCell colSpan={5} className="text-muted-foreground text-xs">
                {totals.isBalanced
                  ? "Balanced"
                  : `Difference ${formatDecimal(totals.difference)} (server confirms on post)`}
              </TableCell>
            </TableRow>
          </TableBody>
        </table>
      </div>
      {disabled ? null : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => append(emptyJournalLine())}
        >
          <Plus className="size-3.5" />
          Add line
        </Button>
      )}
      <AccountFormDialog
        open={creatingAccount !== null}
        account={null}
        nested
        onOpenChange={(open) => {
          if (!open) {
            setCreatingAccount(null);
          }
        }}
        onCreated={(entity) => {
          if (creatingAccount !== null) {
            form.setValue(`lines.${creatingAccount}.account_id`, entity.id);
          }
        }}
      />
      <CustomerFormDialog
        open={creatingParty?.type === "CUSTOMER"}
        customer={null}
        nested
        onOpenChange={(open) => {
          if (!open) {
            setCreatingParty(null);
          }
        }}
        onCreated={(entity) => {
          if (creatingParty?.type === "CUSTOMER") {
            form.setValue(`lines.${creatingParty.index}.party_id`, entity.id);
            form.setValue(`lines.${creatingParty.index}.party_type`, "CUSTOMER");
          }
        }}
      />
      <SupplierFormDialog
        open={creatingParty?.type === "SUPPLIER"}
        supplier={null}
        nested
        onOpenChange={(open) => {
          if (!open) {
            setCreatingParty(null);
          }
        }}
        onCreated={(entity) => {
          if (creatingParty?.type === "SUPPLIER") {
            form.setValue(`lines.${creatingParty.index}.party_id`, entity.id);
            form.setValue(`lines.${creatingParty.index}.party_type`, "SUPPLIER");
          }
        }}
      />
    </div>
  );
}
