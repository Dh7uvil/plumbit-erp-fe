import type { Call, CallKind } from "@/modules/communication/calls/schemas";
import {
  CallEventPayloadSchema,
  type Message,
} from "@/modules/communication/messages/schemas";

function formatParticipantNames(
  call: Call,
  currentUserId: string,
  userNames: Map<string, string>,
): string | null {
  const names = call.participants
    .filter((participant) => participant.user_id !== currentUserId)
    .map((participant) => userNames.get(participant.user_id))
    .filter((name): name is string => Boolean(name?.trim()));

  if (names.length === 0) {
    return null;
  }
  if (names.length <= 2) {
    return names.join(", ");
  }
  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

function resolveOtherUserId(call: Call, currentUserId: string): string | null {
  const participant = call.participants.find((row) => row.user_id !== currentUserId);
  if (participant) {
    return participant.user_id;
  }
  if (call.initiated_by && call.initiated_by !== currentUserId) {
    return call.initiated_by;
  }
  return null;
}

export function callHistoryTitle(
  call: Call,
  currentUserId: string,
  userNames: Map<string, string>,
  conversationTitles?: Map<string, string>,
): string {
  const conversationTitle = conversationTitles?.get(call.conversation_id);
  if (conversationTitle && conversationTitle !== "Direct message") {
    return conversationTitle;
  }

  if (call.scope === "GROUP") {
    return formatParticipantNames(call, currentUserId, userNames) ?? "Group call";
  }

  const otherUserId = resolveOtherUserId(call, currentUserId);
  if (otherUserId) {
    return userNames.get(otherUserId) ?? "Unknown user";
  }

  return "Direct call";
}

export function callHistorySummary(call: Call, currentUserId: string): string {
  const outgoing = call.initiated_by === currentUserId;
  const direction = outgoing ? "Outgoing" : "Incoming";
  const kindLabel = call.kind === "VIDEO" ? "Video call" : "Audio call";

  if (call.status === "MISSED") {
    return outgoing
      ? `${direction} · No answer`
      : `Missed ${call.kind === "VIDEO" ? "video" : "audio"} call`;
  }
  if (call.status === "REJECTED") {
    return `${direction} · Declined`;
  }
  if (call.status === "CANCELLED") {
    return `${direction} · Cancelled`;
  }

  const duration = formatCallDuration(call.duration_seconds);
  return duration ? `${direction} · ${kindLabel} · ${duration}` : `${direction} · ${kindLabel}`;
}

function parseCallEventBodyFallback(body: string | null): {
  kind: CallKind;
  durationSeconds: number | null;
  missed: boolean;
} {
  const text = body ?? "";
  const missed = /missed/i.test(text);
  const kind = /video/i.test(text) ? "VIDEO" : "AUDIO";
  const durationMatch = /(\d+)\s*min/i.exec(text);
  const durationSeconds = durationMatch
    ? Number.parseInt(durationMatch[1] ?? "0", 10) * 60
    : null;
  return { kind, durationSeconds, missed };
}

export function getCallEventMeta(message: Message): {
  kind: CallKind;
  durationSeconds: number | null;
  missed: boolean;
} | null {
  if (message.kind !== "CALL_EVENT") {
    return null;
  }

  const parsed = CallEventPayloadSchema.safeParse(message.system_payload);
  if (parsed.success) {
    return {
      kind: parsed.data.kind,
      durationSeconds: parsed.data.duration_seconds ?? null,
      missed: parsed.data.missed,
    };
  }

  return parseCallEventBodyFallback(message.body);
}

export function formatCallDuration(seconds: number | null): string {
  if (seconds == null || seconds <= 0) {
    return "";
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes === 0) {
    return `${remainder} sec`;
  }
  return `${minutes} min ${remainder.toString().padStart(2, "0")} sec`;
}
