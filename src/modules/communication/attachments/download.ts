import { chatAttachmentsApi } from "@/modules/communication/attachments/api";

export async function downloadChatAttachment(
  attachmentId: string,
  filename: string,
): Promise<void> {
  const detail = await chatAttachmentsApi.getDownloadUrl(attachmentId);
  const url = detail.download_url;

  if (url.startsWith("/")) {
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) {
      throw new Error("Download failed");
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
    return;
  }

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener noreferrer";
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
