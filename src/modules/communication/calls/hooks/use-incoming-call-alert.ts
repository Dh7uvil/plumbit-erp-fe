"use client";

import { useEffect, useRef } from "react";

import {
  startRingtone,
  stopAllCallSounds,
} from "@/modules/communication/calls/call-sounds";
import type { Call } from "@/modules/communication/calls/schemas";
import { useCommunicationSettings } from "@/modules/communication/settings/queries";
import {
  canShowNotifications,
  showBrowserNotification,
} from "@/modules/communication/shared/notifications";

type UseIncomingCallAlertOptions = {
  call: Call | null;
  callerName?: string;
};

export function useIncomingCallAlert({ call, callerName }: UseIncomingCallAlertOptions) {
  const { data: settings } = useCommunicationSettings();
  const originalTitleRef = useRef<string | null>(null);
  const titleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notificationRef = useRef<Notification | null>(null);

  useEffect(() => {
    if (!call) {
      stopAllCallSounds();
      notificationRef.current?.close();
      notificationRef.current = null;
      if (titleIntervalRef.current) {
        clearInterval(titleIntervalRef.current);
        titleIntervalRef.current = null;
      }
      if (originalTitleRef.current != null) {
        document.title = originalTitleRef.current;
        originalTitleRef.current = null;
      }
      return;
    }

    const label = callerName ?? "Incoming call";
    const callNotificationsEnabled = settings?.call_notifications ?? true;
    const soundEnabled = settings?.sound_enabled ?? true;
    const desktopEnabled = settings?.desktop_notifications ?? false;

    if (callNotificationsEnabled && soundEnabled) {
      startRingtone();
    }

    if (originalTitleRef.current == null) {
      originalTitleRef.current = document.title;
    }
    let showAlertTitle = true;
    titleIntervalRef.current = setInterval(() => {
      document.title = showAlertTitle ? `Incoming call - ${label}` : (originalTitleRef.current ?? label);
      showAlertTitle = !showAlertTitle;
    }, 1000);

    if (
      callNotificationsEnabled &&
      desktopEnabled &&
      canShowNotifications() &&
      document.visibilityState === "hidden"
    ) {
      notificationRef.current = showBrowserNotification(`Incoming call from ${label}`, {
        body: `${call.kind === "VIDEO" ? "Video" : "Audio"} call`,
        tag: call.id,
        requireInteraction: true,
      });
      notificationRef.current?.addEventListener("click", () => {
        window.focus();
        notificationRef.current?.close();
      });
    }

    return () => {
      stopAllCallSounds();
      notificationRef.current?.close();
      notificationRef.current = null;
      if (titleIntervalRef.current) {
        clearInterval(titleIntervalRef.current);
        titleIntervalRef.current = null;
      }
      if (originalTitleRef.current != null) {
        document.title = originalTitleRef.current;
        originalTitleRef.current = null;
      }
    };
  }, [call, callerName, settings?.call_notifications, settings?.desktop_notifications, settings?.sound_enabled]);
}
