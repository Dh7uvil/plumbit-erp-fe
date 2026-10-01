export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) {
    return "unsupported";
  }
  return Notification.permission;
}

export function canShowNotifications(): boolean {
  return getNotificationPermission() === "granted";
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isNotificationSupported()) {
    return "unsupported";
  }
  if (Notification.permission === "granted") {
    return "granted";
  }
  if (Notification.permission === "denied") {
    return "denied";
  }
  return Notification.requestPermission();
}

export function showBrowserNotification(
  title: string,
  options?: NotificationOptions,
): Notification | null {
  if (!canShowNotifications()) {
    return null;
  }
  try {
    return new Notification(title, {
      icon: "/favicon.ico",
      ...options,
    });
  } catch {
    return null;
  }
}

export function playNotificationSound(enabled = true): void {
  if (!enabled || typeof window === "undefined") {
    return;
  }
  try {
    void import("@/modules/communication/calls/call-sounds").then(({ playNotificationChime }) => {
      playNotificationChime();
    });
  } catch {
    // Optional asset; ignore if missing.
  }
}
