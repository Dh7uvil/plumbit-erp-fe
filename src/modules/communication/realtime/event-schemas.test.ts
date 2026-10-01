import { describe, expect, it } from "vitest";

import { parseRealtimeEvent } from "@/modules/communication/realtime/event-schemas";

describe("parseRealtimeEvent", () => {
  it("parses a valid message.created envelope", () => {
    const event = parseRealtimeEvent(
      JSON.stringify({
        v: 1,
        type: "message.created",
        tenant_id: "11111111-1111-4111-8111-111111111111",
        conversation_id: "22222222-2222-4222-8222-222222222222",
        seq: 3,
        actor_id: "33333333-3333-4333-8333-333333333333",
        at: "2026-01-01T00:00:00.000Z",
        data: { body: "hello", client_message_id: "client-1" },
      }),
    );

    expect(event?.type).toBe("message.created");
    expect(event?.seq).toBe(3);
    expect(event?.data.body).toBe("hello");
  });

  it("returns null for invalid payloads", () => {
    expect(parseRealtimeEvent("not-json")).toBeNull();
    expect(parseRealtimeEvent(JSON.stringify({ type: 123 }))).toBeNull();
  });
});
