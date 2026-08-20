const AUTH_PATHS = new Set(["/login", "/forgot-password", "/reset-password"]);

export function isSafeInternalPath(path: string | null | undefined): path is string {
  if (!path) {
    return false;
  }
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return false;
  }
  if (path.includes("://") || path.includes("\\")) {
    return false;
  }
  return true;
}

export function resolvePostLoginPath(next: string | null | undefined): string {
  if (isSafeInternalPath(next) && !AUTH_PATHS.has(next.split("?")[0] ?? "")) {
    return next;
  }
  return "/";
}

export function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.has(pathname);
}
