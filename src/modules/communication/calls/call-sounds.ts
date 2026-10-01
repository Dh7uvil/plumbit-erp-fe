"use client";

const CALL_RINGTONE_SRC = "/sounds/call-ringtone.mp3";
const NOTIFICATION_SRC = "/sounds/notification.mp3";

let unlockInstalled = false;
let ringtoneAudio: HTMLAudioElement | null = null;
let ringbackAudio: HTMLAudioElement | null = null;

function createAudio(src: string, loop: boolean, volume: number): HTMLAudioElement {
  const audio = new Audio(src);
  audio.loop = loop;
  audio.volume = volume;
  audio.preload = "auto";
  return audio;
}

function stopAudio(audio: HTMLAudioElement | null): void {
  if (!audio) {
    return;
  }
  audio.pause();
  audio.currentTime = 0;
}

export function unlockCallAudio(): void {
  if (unlockInstalled || typeof window === "undefined") {
    return;
  }
  unlockInstalled = true;
  const unlock = () => {
    for (const audio of [ringtoneAudio, ringbackAudio]) {
      if (audio && audio.paused) {
        void audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => undefined);
      }
    }
  };
  window.addEventListener("pointerdown", unlock, { once: true, passive: true });
  window.addEventListener("keydown", unlock, { once: true });
}

function playLoopingSound(
  current: HTMLAudioElement | null,
  src: string,
  volume: number,
): HTMLAudioElement {
  stopAudio(current);
  const audio = createAudio(src, true, volume);
  void audio.play().catch(() => undefined);
  return audio;
}

export function startRingtone(): void {
  unlockCallAudio();
  stopRingtone();
  ringtoneAudio = playLoopingSound(ringtoneAudio, CALL_RINGTONE_SRC, 0.55);
}

export function stopRingtone(): void {
  stopAudio(ringtoneAudio);
  ringtoneAudio = null;
}

export function startRingback(): void {
  unlockCallAudio();
  stopRingback();
  ringbackAudio = playLoopingSound(ringbackAudio, CALL_RINGTONE_SRC, 0.35);
}

export function stopRingback(): void {
  stopAudio(ringbackAudio);
  ringbackAudio = null;
}

export function playNotificationChime(): void {
  unlockCallAudio();
  const audio = createAudio(NOTIFICATION_SRC, false, 0.45);
  void audio.play().catch(() => undefined);
}

export function stopAllCallSounds(): void {
  stopRingtone();
  stopRingback();
}
