const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

export const LOGO_PROXY_PATH = "/api/logo-proxy";

export function isLoopbackLogoUrl(logoUrl: string): boolean {
  try {
    const url = new URL(logoUrl);
    return (url.protocol === "http:" || url.protocol === "https:") && LOOPBACK_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Presigned MinIO URLs point at 127.0.0.1, which a remote browser (and an HTTPS
 * ngrok tab) cannot load. Same-origin proxy keeps the image reachable.
 */
export function toDisplayLogoUrl(logoUrl: string | null | undefined): string | undefined {
  if (!logoUrl) {
    return undefined;
  }
  if (logoUrl.startsWith("data:") || logoUrl.startsWith("blob:")) {
    return logoUrl;
  }
  if (!isLoopbackLogoUrl(logoUrl)) {
    return logoUrl;
  }
  return `${LOGO_PROXY_PATH}?url=${encodeURIComponent(logoUrl)}`;
}
