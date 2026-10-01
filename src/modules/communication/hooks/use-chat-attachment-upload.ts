"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { uploadChatAttachment } from "@/modules/communication/attachments/api";
import type { Message } from "@/modules/communication/messages/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { randomUuid } from "@/shared/lib/uuid";

type UploadState = {
  id: string;
  filename: string;
  progress: number;
};

export function useChatAttachmentUpload({
  conversationId,
  onUploaded,
  onUploadStart,
  onUploadEnd,
}: {
  conversationId: string;
  onUploaded?: (message: Message) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
}) {
  const [uploads, setUploads] = useState<UploadState[]>([]);

  const updateProgress = useCallback((uploadId: string, progress: number) => {
    setUploads((current) =>
      current.map((upload) => (upload.id === uploadId ? { ...upload, progress } : upload)),
    );
  }, []);

  const removeUpload = useCallback((uploadId: string) => {
    setUploads((current) => current.filter((upload) => upload.id !== uploadId));
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      const uploadId = randomUuid();
      setUploads((current) => [...current, { id: uploadId, filename: file.name, progress: 0 }]);
      onUploadStart?.();
      try {
        const message = await uploadChatAttachment({
          conversationId,
          file,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          clientMessageId: randomUuid(),
          onProgress: (progress) => updateProgress(uploadId, progress),
        });
        onUploaded?.(message);
      } catch (error) {
        toast.error(getErrorMessage(error) || `Failed to upload ${file.name}`);
      } finally {
        removeUpload(uploadId);
        onUploadEnd?.();
      }
    },
    [conversationId, onUploadEnd, onUploadStart, onUploaded, removeUpload, updateProgress],
  );

  const uploadFiles = useCallback(
    (files: FileList | File[] | null | undefined) => {
      if (!files?.length) {
        return;
      }
      for (const file of Array.from(files)) {
        void uploadFile(file);
      }
    },
    [uploadFile],
  );

  return { uploads, uploadFiles, isUploading: uploads.length > 0 };
}
