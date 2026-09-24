"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState, type KeyboardEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useFieldArray } from "react-hook-form";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { CustomerFormDialog } from "@/modules/crm/customers/components/customer-form-dialog";
import { useAllCustomers } from "@/modules/crm/customers/queries";
import { accountPermissions } from "@/modules/erp/accounting/accounts/permissions";
import { AccountFormDialog } from "@/modules/erp/accounting/accounts/components/account-form-dialog";
import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import { isControlAccount, type Account } from "@/modules/erp/accounting/accounts/schemas";
import {
  emptyVoucherLine,
  type VoucherFormValues,
} from "@/modules/erp/accounting/vouchers/schemas";
import { SupplierFormDialog } from "@/modules/erp/suppliers/components/supplier-form-dialog";
import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import { DocumentViewTableContainer } from "@/shared/components/document/document-view-table-container";
import { TableActionTooltip } from "@/shared/components/data-table/row-actions";
import { DecimalInput } from "@/shared/components/form/decimal-input";
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
import { sumMoneyStrings } from "@/shared/components/document/payment-allocation-editor";
import { formatReportMoney } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

function partyTypeFor(account: Account | undefined): "CUSTOMER" | "SUPPLIER" | null {
  if (!account || !isControlAccount(account)) {
    return null;
  }
  return account.account_subtype === "ACCOUNTS_RECEIVABLE" ? "CUSTOMER" : "SUPPLIER";
}

export function VoucherLinesEditor({
  form,
  disabled,
  currencyCode,
  onTotalChange,
}: {
  form: UseFormReturn<VoucherFormValues>;
  disabled: boolean;
  currencyCode?: string | null;
  onTotalChange?: (total: string) => void;
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
  const lineTotal = sumMoneyStrings((watchedLines ?? []).map((line) => line.amount));
  const showPartyColumns = (watchedLines ?? []).some((line) =>
    Boolean(partyTypeFor(accountsById.get(line.account_id))),
  );

  function syncTotal() {
    onTotalChange?.(lineTotal);
    form.setValue("total_amount", lineTotal, { shouldDirty: true, shouldValidate: true });
  }

  function onLastFieldKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (disabled) {
      return;
    }
    if (event.key === "Enter" && index === fields.length - 1) {
      event.preventDefault();
      append(emptyVoucherLine());
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <DocumentViewTableContainer viewMode={disabled} rowCount={fields.length}>
        <table className="w-full caption-bottom text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[16rem]">Account</TableHead>
              <TableHead className="min-w-[8rem]">Amount</TableHead>
              {showPartyColumns ? <TableHead className="min-w-[12rem]">Party</TableHead> : null}
              <TableHead className="min-w-[12rem]">Description</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => {
              const accountId = watchedLines?.[index]?.account_id;
              const account = accountsById.get(accountId ?? "");
              const partyKind = partyTypeFor(account);
              return (
                <TableRow key={field.id}>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`lines.${index}.account_id`}
                      render={({ field: lineField }) => (
                        <FormItem>
                          <MasterSelect
                            value={lineField.value}
                            onValueChange={(value) => {
                              lineField.onChange(value);
                              const nextAccount = accountsById.get(value);
                              const nextPartyKind = partyTypeFor(nextAccount);
                              if (nextPartyKind) {
                                form.setValue(`lines.${index}.party_type`, nextPartyKind);
                              } else {
                                form.setValue(`lines.${index}.party_type`, OPTIONAL_SELECT_NONE);
                                form.setValue(`lines.${index}.party_id`, OPTIONAL_SELECT_NONE);
                              }
                            }}
                            disabled={disabled || accountsQuery.isLoading}
                            placeholder="Select account"
                            searchPlaceholder="Search account…"
                            createLabel="Create account"
                            onCreate={
                              can(accountPermissions.create)
                                ? () => setCreatingAccount(index)
                                : undefined
                            }
                            options={[
                              { value: OPTIONAL_SELECT_NONE, label: "Select account" },
                              ...accounts.map((row) => ({
                                value: row.id,
                                label: `${row.code} — ${row.name}`,
                              })),
                            ]}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`lines.${index}.amount`}
                      render={({ field: lineField }) => (
                        <FormItem>
                          <FormControl>
                            <DecimalInput
                              kind="money"
                              disabled={disabled}
                              {...lineField}
                              onChange={(value) => {
                                lineField.onChange(value);
                                queueMicrotask(syncTotal);
                              }}
                              onKeyDown={(event) => onLastFieldKeyDown(index, event)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  {showPartyColumns ? (
                    <TableCell>
                      {partyKind ? (
                        <FormField
                          control={form.control}
                          name={`lines.${index}.party_id`}
                          render={({ field: lineField }) => (
                            <FormItem>
                              <MasterSelect
                                value={lineField.value}
                                onValueChange={(value) => {
                                  lineField.onChange(value);
                                  form.setValue(`lines.${index}.party_type`, partyKind);
                                  if (value !== OPTIONAL_SELECT_NONE) {
                                    form.setValue("party_type", partyKind);
                                    form.setValue("party_id", value);
                                  }
                                }}
                                disabled={disabled}
                                placeholder={partyKind === "CUSTOMER" ? "Customer" : "Supplier"}
                                searchPlaceholder="Search party…"
                                createLabel={
                                  partyKind === "CUSTOMER" ? "Create customer" : "Create supplier"
                                }
                                onCreate={() => setCreatingParty({ type: partyKind, index })}
                                options={[
                                  {
                                    value: OPTIONAL_SELECT_NONE,
                                    label:
                                      partyKind === "CUSTOMER"
                                        ? "Select customer"
                                        : "Select supplier",
                                  },
                                  ...(partyKind === "CUSTOMER" ? customers : suppliers).map(
                                    (row) => ({
                                      value: row.id,
                                      label: row.name,
                                    }),
                                  ),
                                ]}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`lines.${index}.description`}
                      render={({ field: lineField }) => (
                        <FormItem>
                          <FormControl>
                            <Input disabled={disabled} placeholder="Line note" {...lineField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <TableActionTooltip label="Remove line">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={disabled || fields.length <= 1}
                        onClick={() => {
                          remove(index);
                          queueMicrotask(syncTotal);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableActionTooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </table>
      </DocumentViewTableContainer>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => append(emptyVoucherLine())}
        >
          <Plus className="size-3.5" />
          Add line
        </Button>
        <p className="text-muted-foreground text-sm">
          Line total {formatReportMoney(lineTotal, currencyCode)}
        </p>
      </div>
      <AccountFormDialog
        open={creatingAccount != null}
        account={null}
        onOpenChange={(open) => !open && setCreatingAccount(null)}
        onCreated={(account) => {
          if (creatingAccount != null) {
            form.setValue(`lines.${creatingAccount}.account_id`, account.id);
          }
          setCreatingAccount(null);
        }}
      />
      <CustomerFormDialog
        open={creatingParty?.type === "CUSTOMER"}
        customer={null}
        onOpenChange={(open) => !open && setCreatingParty(null)}
        onCreated={(customer) => {
          if (creatingParty?.type === "CUSTOMER") {
            form.setValue(`lines.${creatingParty.index}.party_id`, customer.id);
            form.setValue(`lines.${creatingParty.index}.party_type`, "CUSTOMER");
            form.setValue("party_type", "CUSTOMER");
            form.setValue("party_id", customer.id);
          }
          setCreatingParty(null);
        }}
      />
      <SupplierFormDialog
        open={creatingParty?.type === "SUPPLIER"}
        supplier={null}
        onOpenChange={(open) => !open && setCreatingParty(null)}
        onCreated={(supplier) => {
          if (creatingParty?.type === "SUPPLIER") {
            form.setValue(`lines.${creatingParty.index}.party_id`, supplier.id);
            form.setValue(`lines.${creatingParty.index}.party_type`, "SUPPLIER");
            form.setValue("party_type", "SUPPLIER");
            form.setValue("party_id", supplier.id);
          }
          setCreatingParty(null);
        }}
      />
    </div>
  );
}
