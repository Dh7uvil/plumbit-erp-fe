const TABBABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function isFocusableElement(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement)) {
    return false;
  }
  if (element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true") {
    return false;
  }
  const tabIndex = element.getAttribute("tabindex");
  if (tabIndex === "-1") {
    return false;
  }
  if (element.getAttribute("aria-hidden") === "true") {
    return false;
  }
  if (!element.matches(TABBABLE_SELECTOR)) {
    return tabIndex !== null && Number(tabIndex) >= 0;
  }
  const style = window.getComputedStyle(element);
  if (style.visibility === "hidden" || style.display === "none") {
    return false;
  }
  return element.getClientRects().length > 0;
}

export function getDocumentTabbables(excludeSubtree?: HTMLElement | null): HTMLElement[] {
  const nodes = Array.from(document.querySelectorAll(TABBABLE_SELECTOR));
  return nodes.filter((node): node is HTMLElement => {
    if (!isFocusableElement(node)) {
      return false;
    }
    if (excludeSubtree?.contains(node)) {
      return false;
    }
    return true;
  });
}

export function focusAdjacentTabbable(
  anchor: HTMLElement,
  direction: "next" | "prev",
  excludeSubtree?: HTMLElement | null,
): void {
  const tabbables = getDocumentTabbables(excludeSubtree);
  const index = tabbables.indexOf(anchor);
  if (index === -1) {
    anchor.focus({ preventScroll: true });
    return;
  }
  const nextIndex = direction === "next" ? index + 1 : index - 1;
  const target = tabbables[nextIndex];
  if (target) {
    target.focus({ preventScroll: true });
    return;
  }
  anchor.focus({ preventScroll: true });
}
