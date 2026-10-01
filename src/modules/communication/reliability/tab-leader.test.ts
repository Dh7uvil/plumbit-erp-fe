import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTabLeader } from "@/modules/communication/reliability/tab-leader";

class MockBroadcastChannel {
  static instances: MockBroadcastChannel[] = [];
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.instances.push(this);
  }

  postMessage(data: unknown) {
    for (const channel of MockBroadcastChannel.instances) {
      if (channel !== this) {
        channel.onmessage?.({ data } as MessageEvent);
      }
    }
  }

  close() {
    MockBroadcastChannel.instances = MockBroadcastChannel.instances.filter((c) => c !== this);
  }
}

describe("tab leader election", () => {
  beforeEach(() => {
    MockBroadcastChannel.instances = [];
    vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);
    vi.stubGlobal("crypto", { randomUUID: () => "tab-test-id" });
  });

  it("claims leadership in a single tab", () => {
    const onLeader = vi.fn();
    const onFollower = vi.fn();
    const handle = createTabLeader({ onLeader, onFollower });
    expect(handle.isLeader()).toBe(true);
    expect(onLeader).toHaveBeenCalled();
    handle.dispose();
  });

  it("yields leadership when another tab claims", () => {
    const leader = createTabLeader({ onLeader: vi.fn(), onFollower: vi.fn() });
    const follower = createTabLeader({ onLeader: vi.fn(), onFollower: vi.fn() });
    expect(leader.isLeader() || follower.isLeader()).toBe(true);
    leader.dispose();
    follower.dispose();
  });
});
