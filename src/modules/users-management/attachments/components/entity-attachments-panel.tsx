"use client";

import { ChevronLeft, ChevronRight, FileUp, Loader2, Paperclip, Trash2 } from "lucide-react";
import { type KeyboardEvent, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { MAX_ATTACHMENT_BYTES } from "@/config/constants";
import { attachmentsApi } from "@/modules/users-management/attachments/api";
import {
  useCreateAttachment,
  useDeleteAttachment,
  useUpdateAttachment,
} from "@/modules/users-management/attachments/mutations";
import { attachmentPermissions } from "@/modules/users-management/attachments/permissions";
import { useEntityAttachments } from "@/modules/users-management/attachments/queries";
import {
  ATTACHMENT_CATEGORIES,
  ATTACHMENT_CATEGORY_LABELS,
  isImageAttachment,
  type Attachment,
  type AttachmentCategory,
  type AttachmentEntityType,
} from "@/modules/users-management/attachments/schemas";
import { ApiError, getErrorMessage } from "@/shared/api/errors";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
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

function groupAttachments(rows: Attachment[]): Array<{
  key: string;
  label: string;
  items: Attachment[];
}> {
  const groups = new Map<string, Attachment[]>();
  for (const row of rows) {
    const key = row.category ?? "";
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  const ordered: Array<{ key: string; label: string; items: Attachment[] }> = [];
  for (const category of ATTACHMENT_CATEGORIES) {
    const items = groups.get(category);
    if (items?.length) {
      ordered.push({ key: category, label: ATTACHMENT_CATEGORY_LABELS[category], items });
    }
  }
  const uncategorized = groups.get("");
  if (uncategorized?.length) {
    ordered.push({ key: "", label: "Uncategorized", items: uncategorized });
  }
  return ordered;
}

export function EntityAttachmentsPanel({
  entityType,
  entityId,
  parentPosted = false,
}: {
  entityType: AttachmentEntityType;
  entityId: string;
  parentPosted?: boolean;
}) {
  const can = useCan();
  const canRead = can(attachmentPermissions.read);
  const inputRef = useRef<HTMLInputElement>(null);
  const attachmentsQuery = useEntityAttachments(entityType, entityId, canRead);
  const createAttachment = useCreateAttachment();
  const updateAttachment = useUpdateAttachment();
  const deleteAttachment = useDeleteAttachment();
  const [uploadCategory, setUploadCategory] = useState<AttachmentCategory>("OTHER");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const rows = useMemo(() => attachmentsQuery.data ?? [], [attachmentsQuery.data]);
  const grouped = useMemo(() => groupAttachments(rows), [rows]);
  const images = useMemo(() => rows.filter(isImageAttachment), [rows]);
  const lightboxIndex = lightboxId ? images.findIndex((row) => row.id === lightboxId) : -1;
  const lightboxItem = lightboxIndex >= 0 ? images[lightboxIndex] : null;
  const canDelete = can(attachmentPermissions.delete) && !parentPosted;

  async function onUpload(file: File) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error(
        getErrorMessage(
          new ApiError("VALIDATION_ERROR", "", 400, {
            max_upload_size_mb: Math.round(MAX_ATTACHMENT_BYTES / (1024 * 1024)),
            size_bytes: file.size,
          }),
        ),
      );
      return;
    }
    try {
      await createAttachment.mutateAsync({
        entity_type: entityType,
        entity_id: entityId,
        file,
        category: uploadCategory,
      });
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

  async function openLightbox(id: string) {
    setLightboxId(id);
    setLightboxUrl(null);
    try {
      const detail = await attachmentsApi.get(id);
      setLightboxUrl(detail.download_url);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setLightboxId(null);
    }
  }

  function onLightboxKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!lightboxItem) {
      return;
    }
    if (event.key === "ArrowLeft" && lightboxIndex > 0) {
      event.preventDefault();
      void openLightbox(images[lightboxIndex - 1].id);
    }
    if (event.key === "ArrowRight" && lightboxIndex < images.length - 1) {
      event.preventDefault();
      void openLightbox(images[lightboxIndex + 1].id);
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
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">Attachments</CardTitle>
        {can(attachmentPermissions.create) ? (
          <div className="flex items-center gap-2">
            <Select
              value={uploadCategory}
              onValueChange={(value) => setUploadCategory(value as AttachmentCategory)}
            >
              <SelectTrigger className="h-8 w-44" aria-label="Attachment category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {ATTACHMENT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {ATTACHMENT_CATEGORY_LABELS[category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          </div>
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
        {!attachmentsQuery.isLoading && !attachmentsQuery.isError && grouped.length > 0 ? (
          <div className="flex flex-col gap-5">
            {grouped.map((group) => {
              const showGrid = group.items.every(isImageAttachment);
              return (
                <section key={group.key || "uncategorized"} className="flex flex-col gap-2">
                  <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {group.label}
                  </h3>
                  {showGrid ? (
                    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {group.items.map((row) => (
                        <li key={row.id} className="flex flex-col gap-1">
                          <button
                            type="button"
                            className="bg-muted overflow-hidden rounded-md border"
                            onClick={() => void openLightbox(row.id)}
                          >
                            {row.thumbnail_url ? (
                              // Thumbnails are short-lived presigned URLs from the API.
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={row.thumbnail_url}
                                alt={row.original_filename}
                                className="h-28 w-full object-cover"
                              />
                            ) : (
                              <span className="text-muted-foreground flex h-28 items-center justify-center text-xs">
                                {row.original_filename}
                              </span>
                            )}
                          </button>
                          <AttachmentRowMeta
                            row={row}
                            canUpdate={can(attachmentPermissions.update)}
                            canDelete={canDelete}
                            pending={updateAttachment.isPending}
                            onCategoryChange={(category) =>
                              void updateAttachment
                                .mutateAsync({ id: row.id, category })
                                .then(() => toast.success("Category updated"))
                                .catch((error) => toast.error(getErrorMessage(error)))
                            }
                            onDelete={() => setDeletingId(row.id)}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {group.items.map((row) => (
                        <li
                          key={row.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                        >
                          <button
                            type="button"
                            className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
                            onClick={() =>
                              isImageAttachment(row)
                                ? void openLightbox(row.id)
                                : void onDownload(row.id, row.original_filename)
                            }
                          >
                            <Paperclip className="text-muted-foreground size-3.5 shrink-0" />
                            <span className="truncate font-medium">{row.original_filename}</span>
                            <span className="text-muted-foreground shrink-0 text-xs">
                              {formatBytes(row.size_bytes)} · {formatDateTime(row.created_at)}
                            </span>
                          </button>
                          <AttachmentRowMeta
                            row={row}
                            canUpdate={can(attachmentPermissions.update)}
                            canDelete={canDelete}
                            pending={updateAttachment.isPending}
                            onCategoryChange={(category) =>
                              void updateAttachment
                                .mutateAsync({ id: row.id, category })
                                .then(() => toast.success("Category updated"))
                                .catch((error) => toast.error(getErrorMessage(error)))
                            }
                            onDelete={() => setDeletingId(row.id)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
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
      <Dialog
        open={Boolean(lightboxItem)}
        onOpenChange={(open) => {
          if (!open) {
            setLightboxId(null);
            setLightboxUrl(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl" onKeyDown={onLightboxKeyDown}>
          <DialogHeader>
            <DialogTitle>{lightboxItem?.original_filename ?? "Attachment"}</DialogTitle>
            <DialogDescription>
              {lightboxIndex >= 0
                ? `Image ${lightboxIndex + 1} of ${images.length}`
                : "Image preview"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              disabled={lightboxIndex <= 0}
              aria-label="Previous image"
              onClick={() => {
                if (lightboxIndex > 0) {
                  void openLightbox(images[lightboxIndex - 1].id);
                }
              }}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="bg-muted flex min-h-64 flex-1 items-center justify-center overflow-hidden rounded-md">
              {lightboxUrl ? (
                // Full-size preview uses a short-lived presigned URL.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={lightboxUrl}
                  alt={lightboxItem?.original_filename ?? "Attachment"}
                  className="max-h-[70vh] w-full object-contain"
                />
              ) : (
                <Loader2 className="size-5 animate-spin" />
              )}
            </div>
            <Button
              type="button"
              size="icon"
              variant="outline"
              disabled={lightboxIndex < 0 || lightboxIndex >= images.length - 1}
              aria-label="Next image"
              onClick={() => {
                if (lightboxIndex < images.length - 1) {
                  void openLightbox(images[lightboxIndex + 1].id);
                }
              }}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function AttachmentRowMeta({
  row,
  canUpdate,
  canDelete,
  pending,
  onCategoryChange,
  onDelete,
}: {
  row: Attachment;
  canUpdate: boolean;
  canDelete: boolean;
  pending: boolean;
  onCategoryChange: (category: AttachmentCategory) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-1">
      {canUpdate ? (
        <Select
          value={row.category ?? "OTHER"}
          disabled={pending}
          onValueChange={(value) => onCategoryChange(value as AttachmentCategory)}
        >
          <SelectTrigger
            className="h-7 w-36 text-xs"
            aria-label={`Category for ${row.original_filename}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ATTACHMENT_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {ATTACHMENT_CATEGORY_LABELS[category]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span className="text-muted-foreground text-xs">
          {row.category ? ATTACHMENT_CATEGORY_LABELS[row.category] : "Uncategorized"}
        </span>
      )}
      {canDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive size-7"
          aria-label={`Delete ${row.original_filename}`}
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}
