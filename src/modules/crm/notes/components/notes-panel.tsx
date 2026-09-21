"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { CrmRelatedEntityType } from "@/modules/crm/activities/schemas";
import { useCreateNote, useDeleteNote } from "@/modules/crm/notes/mutations";
import { notePermissions } from "@/modules/crm/notes/permissions";
import { useNotes } from "@/modules/crm/notes/queries";
import { NoteFormSchema, type Note, type NoteFormValues } from "@/modules/crm/notes/schemas";
import { useUserNameMap } from "@/shared/components/data-table/audit-columns";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Textarea } from "@/shared/components/ui/textarea";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { formatDateTime } from "@/shared/lib/format";

export function NotesPanel({
  entityType,
  entityId,
}: {
  entityType: CrmRelatedEntityType;
  entityId: string;
}) {
  const { canCreate, canDelete } = useCrudPermissions(notePermissions);
  const listQuery = useNotes({
    page: 1,
    page_size: 50,
    sort_by: "created_at",
    sort_order: "desc",
    related_entity_type: entityType,
    related_entity_id: entityId,
  });
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const userNameById = useUserNameMap();
  const [deleting, setDeleting] = useState<Note | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(NoteFormSchema),
    defaultValues: { body: "" },
  });
  const rows = listQuery.data?.data ?? [];

  async function onSubmit(values: NoteFormValues) {
    setFormError(null);
    try {
      await createNote.mutateAsync({
        body: values.body.trim(),
        related_entity_type: entityType,
        related_entity_id: entityId,
      });
      toast.success("Note added");
      form.reset({ body: "" });
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteNote.mutateAsync(deleting.id);
      toast.success("Note deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notes</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {canCreate ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
              {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Add a note</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Write a note…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={createNote.isPending}>
                  {createNote.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Add note
                </Button>
              </div>
            </form>
          </Form>
        ) : null}
        {listQuery.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : listQuery.isError ? (
          <DataTableError
            message={getErrorMessage(listQuery.error)}
            onRetry={() => listQuery.refetch()}
          />
        ) : rows.length === 0 ? (
          <DataTableEmpty
            title="No notes"
            message={emptyListMessage(canCreate, "Add the first note for this record.")}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row) => (
              <li key={row.id} className="border-border rounded-md border px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm whitespace-pre-wrap">{row.body}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {row.created_by ? (userNameById.get(row.created_by) ?? "User") : "User"} ·{" "}
                      {formatDateTime(row.created_at)}
                    </p>
                  </div>
                  {canDelete ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label="Delete note"
                      onClick={() => setDeleting(row)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete note"
        description="Delete this note? This cannot be undone."
        confirmLabel="Delete"
        pending={deleteNote.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </Card>
  );
}
