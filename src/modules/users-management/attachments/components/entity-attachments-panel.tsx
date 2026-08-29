"use client";

import { FileUp, Loader2, Paperclip, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { MAX_ATTACHMENT_BYTES } from "@/config/constants";
import { attachmentsApi } from "@/modules/users-management/attachments/api";
import {
  useCreateAttachment,
  useDeleteAttachment,
} from "@/modules/users-management/attachments/mutations";
import { attachmentPermissions } from "@/modules/users-management/attachments/permissions";
import { useEntityAttachments } from "@/modules/users-management/attachments/queries";
import type { AttachmentEntityType } from "@/modules/users-management/attachments/schemas";
import { ApiError, getErrorMessage } from "@/shared/api/errors";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatDateTime } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

function formatBytes(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function EntityAttachmentsPanel({
  entityType,
  entityId,
}: {
  entityType: AttachmentEntityType;
  entityId: string;
}) {
  const can = useCan();
  const canRead = can(attachmentPermissions.read);
  const inputRef = useRef<HTMLInputElement>(null);
  const attachmentsQuery = useEntityAttachments(entityType, entityId, canRead);
  const createAttachment = useCreateAttachment();
  const deleteAttachment = useDeleteAttachment();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const rows = attachmentsQuery.data ?? [];

  async function onUpload(file: File) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error("Files must be 25 MB or smaller.");
      return;
    }
    try {
      await createAttachment.mutateAsync({ entity_type: entityType, entity_id: entityId, file });
      toast.success("File uploaded");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function onDownload(id: string, filename: string) {
    try {
      const detail = await attachmentsApi.get(id);
      const link = document.createElement("a");
      link.href = detail.download_url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = filename;
      link.click();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function confirmDelete() {
    if (!deletingId) {
      return;
    }
    try {
      await deleteAttachment.mutateAsync(deletingId);
      toast.success("Attachment deleted");
      setDeletingId(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (!canRead) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Attachments</CardTitle>
        {can(attachmentPermissions.create) ? (
          <>
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) {
                  void onUpload(file);
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={createAttachment.isPending}
              onClick={() => inputRef.current?.click()}
            >
              {createAttachment.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FileUp className="size-3.5" />
              )}
              Upload
            </Button>
          </>
        ) : null}
      </CardHeader>
      <CardContent>
        {attachmentsQuery.isLoading ? <Skeleton className="h-20 w-full" /> : null}
        {attachmentsQuery.isError ? (
          <DataTableError
            message={
              attachmentsQuery.error instanceof ApiError
                ? getErrorMessage(attachmentsQuery.error)
                : getErrorMessage(attachmentsQuery.error)
            }
            onRetry={() => attachmentsQuery.refetch()}
          />
        ) : null}
        {!attachmentsQuery.isLoading && !attachmentsQuery.isError && rows.length === 0 ? (
          <DataTableEmpty title="No attachments" message="Upload a file to get started." />
        ) : null}
        {!attachmentsQuery.isLoading && !attachmentsQuery.isError && rows.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
                  onClick={() => void onDownload(row.id, row.original_filename)}
                >
                  <Paperclip className="text-muted-foreground size-3.5 shrink-0" />
                  <span className="truncate font-medium">{row.original_filename}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {formatBytes(row.size_bytes)} · {formatDateTime(row.created_at)}
                  </span>
                </button>
                {can(attachmentPermissions.delete) ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive size-7"
                    aria-label={`Delete ${row.original_filename}`}
                    onClick={() => setDeletingId(row.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
      <ConfirmActionDialog
        open={Boolean(deletingId)}
        title="Delete attachment"
        description="Delete this file? This cannot be undone."
        confirmLabel="Delete"
        pending={deleteAttachment.isPending}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onConfirm={() => void confirmDelete()}
      />
    </Card>
  );
}
