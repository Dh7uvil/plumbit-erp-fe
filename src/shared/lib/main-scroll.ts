export const MAIN_CONTENT_ID = "main-content";

/** Sticky app header + docs in-page anchors. */
export const MAIN_SCROLL_TOP_OFFSET_PX = 96;

/** Breathing room below the last block inside the scroll area. */
export const MAIN_SCROLL_BOTTOM_INSET_PX = 8;

export function getMainScrollElement(): HTMLElement | null {
  return document.getElementById(MAIN_CONTENT_ID);
}

export function getMainBottomInset(main: HTMLElement): number {
  const paddingBottom = Number.parseFloat(getComputedStyle(main).paddingBottom) || 0;
  return paddingBottom + MAIN_SCROLL_BOTTOM_INSET_PX;
}

export function scrollMainToElement(
  target: HTMLElement,
  options?: { behavior?: ScrollBehavior; offset?: number },
): void {
  const main = getMainScrollElement();
  if (!main?.contains(target)) {
    target.scrollIntoView({ behavior: options?.behavior ?? "smooth", block: "start" });
    return;
  }

  const offset = options?.offset ?? MAIN_SCROLL_TOP_OFFSET_PX;
  const mainRect = main.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const nextTop = main.scrollTop + targetRect.top - mainRect.top - offset;

  main.scrollTo({
    top: Math.max(nextTop, 0),
    behavior: options?.behavior ?? "smooth",
  });
}

export function scrollMainToHash(hash: string, behavior: ScrollBehavior = "smooth"): void {
  if (!hash || hash === "#") {
    return;
  }

  const id = decodeURIComponent(hash.replace(/^#/, ""));
  const target = document.getElementById(id);
  if (!target) {
    return;
  }

  scrollMainToElement(target, { behavior });
}
