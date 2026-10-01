import { messagesApi } from "@/modules/communication/messages/api";
import { MessageSchema, type Message } from "@/modules/communication/messages/schemas";
import {
  AttachmentCompleteRequestSchema,
  AttachmentDownloadResponseSchema,
  AttachmentPresignRequestSchema,
  AttachmentPresignResponseSchema,
  type AttachmentCompleteRequest,
  type AttachmentDownloadResponse,
  type AttachmentPresignRequest,
  type AttachmentPresignResponse,
  type ChatAttachmentKind,
} from "@/modules/communication/attachments/schemas";
import { apiClient } from "@/shared/api/client";

const BASE = "/communication/attachments";

/** Matches backend default `max_upload_size_mb` for multipart message attachments. */
export const CHAT_MULTIPART_MAX_BYTES = 25 * 1024 * 1024;

export function inferAttachmentKind(contentType: string): ChatAttachmentKind {
  if (contentType.startsWith("image/")) {
    return "IMAGE";
  }
  if (contentType.startsWith("video/")) {
    return "VIDEO";
  }
  if (contentType.startsWith("audio/")) {
    return "VOICE";
  }
  return "DOCUMENT";
}

export async function uploadToPresignedUrl(
  uploadUrl: string,
  body: Blob,
  contentType: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) {
        return;
      }
      onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`Upload failed with status ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(body);
  });
}

export const chatAttachmentsApi = {
  getDownloadUrl: async (attachmentId: string): Promise<AttachmentDownloadResponse> =>
    AttachmentDownloadResponseSchema.parse(
      await apiClient.get(`${BASE}/${attachmentId}`),
    ),
  presign: async (values: AttachmentPresignRequest): Promise<AttachmentPresignResponse> =>
    AttachmentPresignResponseSchema.parse(
      await apiClient.post(`${BASE}/presign`, AttachmentPresignRequestSchema.parse(values)),
    ),
  complete: async (
    attachmentId: string,
    values: AttachmentCompleteRequest,
  ): Promise<Message> =>
    MessageSchema.parse(
      await apiClient.post(
        `${BASE}/${attachmentId}/complete`,
        AttachmentCompleteRequestSchema.parse(values),
      ),
    ),
  uploadViaPresign: async (options: {
    conversationId: string;
    file: File | Blob;
    filename: string;
    contentType: string;
    kind?: ChatAttachmentKind;
    clientMessageId?: string;
    durationMs?: number;
    onProgress?: (progress: number) => void;
  }): Promise<Message> => {
    const kind = options.kind ?? inferAttachmentKind(options.contentType);
    const presign = await chatAttachmentsApi.presign({
      filename: options.filename,
      content_type: options.contentType,
      kind,
      conversation_id: options.conversationId,
    });
    if (options.file.size > presign.max_size_bytes) {
      throw new Error("File exceeds maximum size for this attachment type");
    }
    await uploadToPresignedUrl(
      presign.upload_url,
      options.file,
      options.contentType,
      options.onProgress,
    );
    return chatAttachmentsApi.complete(presign.attachment_id, {
      conversation_id: options.conversationId,
      client_message_id: options.clientMessageId ?? null,
      duration_ms: options.durationMs ?? null,
    });
  },
};

export type ChatAttachmentUploadOptions = {
  conversationId: string;
  file: File | Blob;
  filename: string;
  contentType: string;
  kind?: ChatAttachmentKind;
  clientMessageId?: string;
  durationMs?: number;
  onProgress?: (progress: number) => void;
};

/** Presigned direct-to-storage upload; falls back to API multipart when allowed. */
export async function uploadChatAttachment(
  options: ChatAttachmentUploadOptions,
): Promise<Message> {
  const clientMessageId = options.clientMessageId ?? null;
  const mustUsePresign = options.file.size > CHAT_MULTIPART_MAX_BYTES;

  if (!mustUsePresign) {
    try {
      return await chatAttachmentsApi.uploadViaPresign({
        ...options,
        clientMessageId: clientMessageId ?? undefined,
      });
    } catch {
      // CORS / MinIO unavailable — proxy through the API for smaller files.
    }
  }

  if (mustUsePresign) {
    return chatAttachmentsApi.uploadViaPresign({
      ...options,
      clientMessageId: clientMessageId ?? undefined,
    });
  }

  options.onProgress?.(10);
  const file =
    options.file instanceof File
      ? options.file
      : new File([options.file], options.filename, { type: options.contentType });
  const message = await messagesApi.createAttachment(
    options.conversationId,
    file,
    clientMessageId ?? undefined,
  );
  options.onProgress?.(100);
  return message;
}
