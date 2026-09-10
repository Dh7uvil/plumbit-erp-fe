"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { JournalLinesEditor } from "@/modules/erp/accounting/journals/components/journal-lines-editor";
import { toJournalPayload } from "@/modules/erp/accounting/journals/api";
import { useCreateJournal, useUpdateJournal } from "@/modules/erp/accounting/journals/mutations";
import {
  JournalFormSchema,
  emptyJournalLine,
  type JournalEntry,
  type JournalFormValues,
} from "@/modules/erp/accounting/journals/schemas";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { useCurrentTenant } from "@/modules/users-management/tenants/queries";
import { BranchFormDialog } from "@/modules/users-management/branches/components/branch-form-dialog";
import { branchPermissions } from "@/modules/users-management/branches/permissions";
import { useAllBranches } from "@/modules/users-management/branches/queries";
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
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useCan } from "@/shared/providers/session-provider";

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function toFormValues(entry: JournalEntry | null, defaultCurrencyId?: string): JournalFormValues {
  if (!entry) {
    return {
      entry_date: todayIsoDate(),
      currency_id: defaultCurrencyId ?? "",
      exchange_rate: "1",
      branch_id: OPTIONAL_SELECT_NONE,
      narration: "",
      reference: "",
      lines: [emptyJournalLine(), emptyJournalLine()],
    };
  }
  return {
    entry_date: entry.entry_date,
    currency_id: entry.currency_id,
    exchange_rate: entry.exchange_rate,
    branch_id: entry.branch_id ?? OPTIONAL_SELECT_NONE,
    narration: entry.narration ?? "",
    reference: entry.reference ?? "",
    lines:
      entry.lines.length > 0
        ? entry.lines.map((line) => ({
            account_id: line.account_id,
            debit: line.debit === "0" || line.debit === "0.0000" ? "" : line.debit,
            credit: line.credit === "0" || line.credit === "0.0000" ? "" : line.credit,
            party_type: line.party_type ?? OPTIONAL_SELECT_NONE,
            party_id: line.party_id ?? OPTIONAL_SELECT_NONE,
            due_date: line.due_date ?? "",
            external_reference: line.external_reference ?? "",
            description: line.description ?? "",
          }))
        : [emptyJournalLine(), emptyJournalLine()],
  };
}

export function JournalForm({
  journal,
  disabled = false,
  onSuccess,
}: {
  journal: JournalEntry | null;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const can = useCan();
  const router = useRouter();
  const tenantQuery = useCurrentTenant();
  const currenciesQuery = useAllCurrencies();
  const branchesQuery = useAllBranches();
  const createJournal = useCreateJournal();
  const updateJournal = useUpdateJournal();
  const [formError, setFormError] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<unknown>(null);
  const [creatingBranch, setCreatingBranch] = useState(false);
  const isEdit = Boolean(journal);
  const defaultCurrencyId =
    tenantQuery.data?.default_currency_id ??
    currenciesQuery.data?.find((currency) => currency.is_base)?.id;

  const form = useForm<JournalFormValues>({
    resolver: zodResolver(JournalFormSchema),
    values: toFormValues(journal, defaultCurrencyId),
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  useEffect(() => {
    if (journal || !defaultCurrencyId || form.getValues("currency_id")) {
      return;
    }
    form.setValue("currency_id", defaultCurrencyId);
  }, [defaultCurrencyId, form, journal]);

  const pending = createJournal.isPending || updateJournal.isPending;
  const currencies = currenciesQuery.data ?? [];
  const branches = branchesQuery.data ?? [];

  async function onSubmit(values: JournalFormValues) {
    setFormError(null);
    setWriteError(null);
    try {
      const payload = toJournalPayload(values);
      if (isEdit && journal) {
        await updateJournal.mutateAsync({
          id: journal.id,
          values: payload,
          version: journal.version,
        });
        toast.success("Journal saved");
        onSuccess?.();
      } else {
        const created = await createJournal.mutateAsync(payload);
        toast.success("Journal created");
        router.push(`/journals/${created.id}`);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      if (isStockWriteAlertError(error)) {
        setWriteError(error);
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <StockWriteAlert periodLocked={journal?.period_locked} error={writeError} />
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="entry_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entry date</FormLabel>
                <FormControl>
                  <Input type="date" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled}
                  placeholder="Currency"
                  searchPlaceholder="Search currency…"
                  options={currencies.map((currency) => ({
                    value: currency.id,
                    label: `${currency.code} — ${currency.name}`,
                  }))}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="exchange_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exchange rate</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="branch_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Branch</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled}
                  placeholder="No branch"
                  searchPlaceholder="Search branch…"
                  createLabel="Create branch"
                  onCreate={
                    can(branchPermissions.create) ? () => setCreatingBranch(true) : undefined
                  }
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "No branch" },
                    ...branches.map((branch) => ({
                      value: branch.id,
                      label: `${branch.code} — ${branch.name}`,
                    })),
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference</FormLabel>
                <FormControl>
                  <Input disabled={disabled} maxLength={100} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="narration"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Narration</FormLabel>
                <FormControl>
                  <Textarea disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <JournalLinesEditor form={form} disabled={disabled} />
        {disabled ? null : (
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? "Save" : "Create journal"}
            </Button>
          </div>
        )}
      </form>
      <BranchFormDialog
        open={creatingBranch}
        branch={null}
        nested
        onCreated={(entity) => form.setValue("branch_id", entity.id, { shouldDirty: true })}
        onOpenChange={setCreatingBranch}
      />
    </Form>
  );
}
