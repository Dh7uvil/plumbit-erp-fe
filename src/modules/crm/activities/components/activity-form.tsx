"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCreateActivity } from "@/modules/crm/activities/mutations";
import {
  ACTIVITY_PRIORITIES,
  ACTIVITY_PRIORITY_LABELS,
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABELS,
  ActivityFormSchema,
  CRM_RELATED_ENTITY_LABELS,
  CRM_RELATED_ENTITY_TYPES,
  defaultActivityFormValues,
  fromDatetimeLocal,
  type ActivityFormValues,
  type CrmRelatedEntityType,
} from "@/modules/crm/activities/schemas";
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
import { Textarea } from "@/shared/components/ui/textarea";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";

export function ActivityForm({
  related,
  relatedLocked = false,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  related?: { type: CrmRelatedEntityType; id: string };
  relatedLocked?: boolean;
  disabled?: boolean;
  onSuccess?: (entity: { id: string }) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const createActivity = useCreateActivity();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(ActivityFormSchema),
    defaultValues: defaultActivityFormValues(related),
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  async function onSubmit(values: ActivityFormValues) {
    setFormError(null);
    try {
      const created = await createActivity.mutateAsync({
        activity_type: values.activity_type,
        subject: values.subject.trim(),
        description: values.description.trim() || null,
        priority: values.priority,
        due_at: fromDatetimeLocal(values.due_at),
        related_entity_type: values.related_entity_type,
        related_entity_id: values.related_entity_id,
      });
      toast.success("Activity created");
      onSuccess?.(created);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createActivity.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={disabled ? (event) => event.preventDefault() : form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <div data-slot="form-grid" className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="activity_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {ACTIVITY_TYPE_LABELS[type]}
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
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ACTIVITY_PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {ACTIVITY_PRIORITY_LABELS[priority]}
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
            name="subject"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Subject</FormLabel>
                <FormControl>
                  <Input placeholder="Follow up call" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="due_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due</FormLabel>
                <FormControl>
                  <Input type="datetime-local" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {relatedLocked ? null : (
            <>
              <FormField
                control={form.control}
                name="related_entity_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related to</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CRM_RELATED_ENTITY_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {CRM_RELATED_ENTITY_LABELS[type]}
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
                name="related_entity_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Record ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="UUID of the related record"
                        disabled={disabled}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Optional" disabled={disabled} {...field} />
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
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                Create activity
              </Button>
            ) : null}
          </div>
        ) : null}
      </form>
    </Form>
  );
}
