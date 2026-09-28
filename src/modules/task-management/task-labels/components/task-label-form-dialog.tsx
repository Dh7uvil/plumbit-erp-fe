"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  useCreateTaskLabel,
  useUpdateTaskLabel,
} from "@/modules/task-management/task-labels/mutations";
import type { TaskLabel } from "@/modules/task-management/task-labels/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { applyFieldErrors } from "@/shared/lib/form-errors";

const TaskLabelFormSchema = z.object({
  name: z.string().min(1, "Enter a name").max(50),
  color: z.string().min(1).max(20),
});

type TaskLabelFormValues = z.infer<typeof TaskLabelFormSchema>;

export function TaskLabelFormDialog({
  open,
  onOpenChange,
  label,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label?: TaskLabel | null;
}) {
  const createLabel = useCreateTaskLabel();
  const updateLabel = useUpdateTaskLabel();
  const form = useForm<TaskLabelFormValues>({
    resolver: zodResolver(TaskLabelFormSchema),
    values: {
      name: label?.name ?? "",
      color: label?.color ?? "gray",
    },
  });

  async function onSubmit(values: TaskLabelFormValues) {
    try {
      if (label) {
        await updateLabel.mutateAsync({ id: label.id, values });
        toast.success("Label updated");
      } else {
        await createLabel.mutateAsync(values);
        toast.success("Label created");
      }
      onOpenChange(false);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) return;
      toast.error(getErrorMessage(error));
    }
  }

  const pending = createLabel.isPending || updateLabel.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label ? "Edit label" : "New label"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="gray" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : label ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
