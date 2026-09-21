"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useAllLeadSources } from "@/modules/crm/lead-sources/queries";
import { useCreateOpportunity, useUpdateOpportunity } from "@/modules/crm/opportunities/mutations";
import {
  OpportunityFormSchema,
  defaultOpportunityFormValues,
  type Opportunity,
  type OpportunityCreateRequest,
  type OpportunityFormValues,
} from "@/modules/crm/opportunities/schemas";
import { useAllPipelines, usePipeline } from "@/modules/crm/pipelines/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { getErrorMessage } from "@/shared/api/errors";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";

function toFormValues(opportunity: Opportunity | null): OpportunityFormValues {
  if (!opportunity) {
    return defaultOpportunityFormValues();
  }
  return {
    name: opportunity.name,
    pipeline_id: opportunity.pipeline_id,
    stage_id: opportunity.stage_id,
    amount: opportunity.amount ?? "",
    currency_id: opportunity.currency_id ?? OPTIONAL_SELECT_NONE,
    expected_close_date: opportunity.expected_close_date?.slice(0, 10) ?? "",
    source_id: opportunity.source_id ?? OPTIONAL_SELECT_NONE,
  };
}

function toPayload(values: OpportunityFormValues, isEdit: boolean): OpportunityCreateRequest {
  const amount = values.amount.trim();
  const currencyId =
    values.currency_id === OPTIONAL_SELECT_NONE ? null : values.currency_id || null;
  const sourceId = values.source_id === OPTIONAL_SELECT_NONE ? null : values.source_id || null;
  return {
    name: values.name.trim(),
    ...(isEdit
      ? {}
      : {
          pipeline_id:
            values.pipeline_id === OPTIONAL_SELECT_NONE ? null : values.pipeline_id || null,
          stage_id: values.stage_id === OPTIONAL_SELECT_NONE ? null : values.stage_id || null,
        }),
    amount: amount ? amount : null,
    currency_id: amount ? currencyId : null,
    expected_close_date: values.expected_close_date.trim() || null,
    source_id: sourceId,
  };
}

export function OpportunityForm({
  opportunity,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  opportunity?: Opportunity | null;
  disabled?: boolean;
  onSuccess?: (entity: Opportunity) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const isEdit = Boolean(opportunity);
  const createOpportunity = useCreateOpportunity();
  const updateOpportunity = useUpdateOpportunity();
  const pipelinesQuery = useAllPipelines(!disabled);
  const currenciesQuery = useAllCurrencies(!disabled);
  const sourcesQuery = useAllLeadSources(!disabled);
  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(OpportunityFormSchema),
    defaultValues: toFormValues(opportunity ?? null),
  });
  useDirtyFormGuard(form.formState.isDirty);
  const pipelineId = form.watch("pipeline_id");
  const pipelineQuery = usePipeline(
    pipelineId && pipelineId !== OPTIONAL_SELECT_NONE ? pipelineId : null,
  );
  const openStages = useMemo(
    () => (pipelineQuery.data?.stages ?? []).filter((stage) => stage.stage_kind === "OPEN"),
    [pipelineQuery.data?.stages],
  );

  useEffect(() => {
    form.reset(toFormValues(opportunity ?? null));
  }, [opportunity, form]);

  useEffect(() => {
    if (!isEdit && pipelinesQuery.data?.length === 1) {
      form.setValue("pipeline_id", pipelinesQuery.data[0].id);
    }
  }, [form, isEdit, pipelinesQuery.data]);

  async function onSubmit(values: OpportunityFormValues) {
    try {
      if (isEdit && opportunity) {
        const updated = await updateOpportunity.mutateAsync({
          id: opportunity.id,
          version: opportunity.version,
          ...toPayload(values, true),
        });
        toast.success("Opportunity updated");
        onSuccess?.(updated);
      } else {
        const created = await createOpportunity.mutateAsync(toPayload(values, false));
        toast.success("Opportunity created");
        onSuccess?.(created);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      toast.error(getErrorMessage(error));
    }
  }

  const pending = createOpportunity.isPending || updateOpportunity.isPending;
  const pipelines = pipelinesQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];
  const sources = sourcesQuery.data ?? [];

  return (
    <Form {...form}>
      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} disabled={disabled || pending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!isEdit ? (
          <>
            <FormField
              control={form.control}
              name="pipeline_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pipeline</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={disabled || pending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pipeline" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pipelines.map((pipeline) => (
                        <SelectItem key={pipeline.id} value={pipeline.id}>
                          {pipeline.name}
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
              name="stage_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stage</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={disabled || pending || openStages.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {openStages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input {...field} disabled={disabled || pending} inputMode="decimal" />
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
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || pending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={OPTIONAL_SELECT_NONE}>None</SelectItem>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.id} value={currency.id}>
                        {currency.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="expected_close_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected close</FormLabel>
              <FormControl>
                <Input type="date" {...field} disabled={disabled || pending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="source_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lead source</FormLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={disabled || pending}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={OPTIONAL_SELECT_NONE}>None</SelectItem>
                  {sources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {!disabled ? (
          <div className="flex justify-end gap-2">
            {showCancel ? (
              <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
                Cancel
              </Button>
            ) : null}
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {isEdit ? "Save" : "Create"}
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  );
}
