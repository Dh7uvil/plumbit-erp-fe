const CHANNEL_NAME = "plumbit-communication-rtm-leader";
const HEARTBEAT_MS = 2_000;
const LEADER_TIMEOUT_MS = 6_000;

type LeaderMessage =
  | { type: "claim"; tabId: string; at: number }
  | { type: "heartbeat"; tabId: string; at: number }
  | { type: "release"; tabId: string };

export type TabLeaderHandle = {
  isLeader: () => boolean;
  dispose: () => void;
};

export function createTabLeader({
  onLeader,
  onFollower,
}: {
  onLeader: () => void;
  onFollower: () => void;
}): TabLeaderHandle {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    onLeader();
    return { isLeader: () => true, dispose: () => undefined };
  }

  const tabId = crypto.randomUUID();
  const channel = new BroadcastChannel(CHANNEL_NAME);
  let leader = false;
  let leaderTabId: string | null = null;
  let lastLeaderBeat = 0;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let electionTimer: ReturnType<typeof setInterval> | null = null;

  const setLeader = (next: boolean) => {
    if (leader === next) {
      return;
    }
    leader = next;
    if (next) {
      onLeader();
    } else {
      onFollower();
    }
  };

  const publish = (message: LeaderMessage) => {
    channel.postMessage(message);
  };

  const claimLeadership = () => {
    leaderTabId = tabId;
    lastLeaderBeat = Date.now();
    setLeader(true);
    publish({ type: "claim", tabId, at: lastLeaderBeat });
  };

  channel.onmessage = (event: MessageEvent<LeaderMessage>) => {
    const message = event.data;
    if (!message?.type) {
      return;
    }
    if (message.type === "release" && message.tabId === leaderTabId) {
      leaderTabId = null;
      lastLeaderBeat = 0;
      return;
    }
    if (message.tabId === tabId) {
      return;
    }
    if (message.type === "claim" || message.type === "heartbeat") {
      leaderTabId = message.tabId;
      lastLeaderBeat = message.at;
      if (leader) {
        setLeader(false);
      }
    }
  };

  electionTimer = setInterval(() => {
    const stale = Date.now() - lastLeaderBeat > LEADER_TIMEOUT_MS;
    if (!leaderTabId || stale) {
      claimLeadership();
    } else if (leaderTabId === tabId) {
      setLeader(true);
    } else {
      setLeader(false);
    }
  }, HEARTBEAT_MS);

  heartbeatTimer = setInterval(() => {
    if (leader) {
      lastLeaderBeat = Date.now();
      publish({ type: "heartbeat", tabId, at: lastLeaderBeat });
    }
  }, HEARTBEAT_MS);

  claimLeadership();

  return {
    isLeader: () => leader,
    dispose: () => {
      if (leader) {
        publish({ type: "release", tabId });
      }
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
      if (electionTimer) {
        clearInterval(electionTimer);
      }
      channel.close();
    },
  };
}
