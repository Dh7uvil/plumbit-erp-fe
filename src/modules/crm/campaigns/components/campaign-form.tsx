"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCreateCampaign, useUpdateCampaign } from "@/modules/crm/campaigns/mutations";
import {
  CAMPAIGN_STATUSES,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TYPES,
  CAMPAIGN_TYPE_LABELS,
  CampaignFormSchema,
  defaultCampaignFormValues,
  type Campaign,
  type CampaignCreateRequest,
  type CampaignFormValues,
  type CampaignStatus,
  type CampaignType,
} from "@/modules/crm/campaigns/schemas";
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

function toFormValues(campaign: Campaign | null): CampaignFormValues {
  if (!campaign) {
    return defaultCampaignFormValues();
  }
  return {
    name: campaign.name,
    campaign_type: campaign.campaign_type,
    status: campaign.status,
    start_date: campaign.start_date?.slice(0, 10) ?? "",
    end_date: campaign.end_date?.slice(0, 10) ?? "",
    budgeted_cost: campaign.budgeted_cost ?? "",
    actual_cost: campaign.actual_cost ?? "",
    expected_revenue: campaign.expected_revenue ?? "",
  };
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toPayload(values: CampaignFormValues): CampaignCreateRequest {
  return {
    name: values.name.trim(),
    campaign_type: values.campaign_type as CampaignType,
    status: values.status as CampaignStatus,
    start_date: emptyToNull(values.start_date),
    end_date: emptyToNull(values.end_date),
    budgeted_cost: emptyToNull(values.budgeted_cost),
    actual_cost: emptyToNull(values.actual_cost),
    expected_revenue: emptyToNull(values.expected_revenue),
  };
}

export function CampaignForm({
  campaign,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  campaign: Campaign | null;
  disabled?: boolean;
  onSuccess?: (entity: Campaign) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(campaign);
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(CampaignFormSchema),
    values: toFormValues(campaign),
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  async function onSubmit(values: CampaignFormValues) {
    setFormError(null);
    const payload = toPayload(values);
    try {
      if (campaign) {
        const updated = await updateCampaign.mutateAsync({ id: campaign.id, values: payload });
        toast.success("Campaign updated");
        onSuccess?.(updated);
      } else {
        const created = await createCampaign.mutateAsync(payload);
        toast.success("Campaign created");
        onSuccess?.(created);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createCampaign.isPending || updateCampaign.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={disabled ? (event) => event.preventDefault() : form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Spring plumbing promo" disabled={disabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="campaign_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select disabled={disabled} onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CAMPAIGN_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {CAMPAIGN_TYPE_LABELS[type]}
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select disabled={disabled} onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CAMPAIGN_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {CAMPAIGN_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start date</FormLabel>
                <FormControl>
                  <Input type="date" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End date</FormLabel>
                <FormControl>
                  <Input type="date" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="budgeted_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budgeted cost</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="actual_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Actual cost</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expected_revenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected revenue</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {showCancel || !disabled ? (
          <div className="flex justify-end gap-2">
            {showCancel ? (
              <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
                {disabled ? "Close" : "Cancel"}
              </Button>
            ) : null}
            {!disabled ? (
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                {isEdit ? "Save changes" : "Create campaign"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </form>
    </Form>
  );
}
