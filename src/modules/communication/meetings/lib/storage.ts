"use client";

import { MeetingListSchema, type Meeting } from "@/modules/communication/meetings/schemas";

const STORAGE_KEY = "communication.meetings.v1";

export function loadMeetings(): Meeting[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    return MeetingListSchema.parse(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function saveMeetings(meetings: Meeting[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
}
