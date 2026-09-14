export const FOCUS_SIDEBAR_SEARCH_EVENT = "plumbit:focus-sidebar-search";

export type KeyboardShortcut = {
  id: string;
  keys: string;
  action: string;
};

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { id: "search", keys: "⌘K / Ctrl+K", action: "Open or close page search" },
  { id: "close", keys: "Esc", action: "Close search and dialogs" },
  { id: "back", keys: "⌘[ / Alt+←", action: "Go back" },
  { id: "forward", keys: "⌘] / Alt+→", action: "Go forward" },
  { id: "help", keys: "⌘/ or ?", action: "Open keyboard shortcuts" },
  { id: "nav-search", keys: "/", action: "Focus sidebar search" },
  { id: "sidebar", keys: "⌘B / Ctrl+B", action: "Collapse or expand sidebar" },
  { id: "new", keys: "N", action: "New record on this page" },
  { id: "edit", keys: "E", action: "Edit the open record" },
  { id: "palette-move", keys: "↑ ↓ Enter", action: "Move and open a search result" },
];

const NON_TEXT_INPUT_TYPES = new Set([
  "button",
  "submit",
  "checkbox",
  "radio",
  "file",
  "reset",
  "range",
  "color",
  "hidden",
]);

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  if (target.closest('[contenteditable="true"], textarea, select, [role="textbox"]')) {
    return true;
  }
  const input = target.closest("input");
  if (!(input instanceof HTMLInputElement)) {
    return false;
  }
  return !NON_TEXT_INPUT_TYPES.has(input.type);
}

export function hasModifier(event: Pick<KeyboardEvent, "metaKey" | "ctrlKey">): boolean {
  return event.metaKey || event.ctrlKey;
}

export function clickLabeledPageAction(pattern: RegExp): boolean {
  const actions = document.querySelector("[data-page-actions]");
  if (!actions) {
    return false;
  }
  const controls = Array.from(actions.querySelectorAll("a, button"));
  const match = controls.find((element) => {
    if (element instanceof HTMLButtonElement && element.disabled) {
      return false;
    }
    return pattern.test(element.textContent?.replace(/\s+/g, " ").trim() ?? "");
  });
  if (!(match instanceof HTMLElement)) {
    return false;
  }
  match.click();
  return true;
}

export function focusSidebarSearch(): void {
  window.dispatchEvent(new Event(FOCUS_SIDEBAR_SEARCH_EVENT));
}
