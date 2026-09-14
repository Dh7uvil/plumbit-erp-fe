import { describe, expect, it } from "vitest";

import { clickLabeledPageAction, isEditableTarget } from "@/shared/lib/keyboard-shortcuts";

describe("isEditableTarget", () => {
  it("treats text inputs as editable", () => {
    const input = document.createElement("input");
    expect(isEditableTarget(input)).toBe(true);
  });

  it("ignores checkbox and button inputs", () => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    const button = document.createElement("input");
    button.type = "button";
    expect(isEditableTarget(checkbox)).toBe(false);
    expect(isEditableTarget(button)).toBe(false);
  });

  it("treats textareas as editable", () => {
    expect(isEditableTarget(document.createElement("textarea"))).toBe(true);
  });
});

describe("clickLabeledPageAction", () => {
  it("clicks the matching page action", () => {
    document.body.innerHTML = `
      <div data-page-actions>
        <button type="button">New Unit</button>
        <button type="button">Export</button>
      </div>
    `;
    const button = document.querySelector("button") as HTMLButtonElement;
    let clicked = false;
    button.addEventListener("click", () => {
      clicked = true;
    });
    expect(clickLabeledPageAction(/^new\b/i)).toBe(true);
    expect(clicked).toBe(true);
  });

  it("returns false when no action matches", () => {
    document.body.innerHTML = `<div data-page-actions><button type="button">Save</button></div>`;
    expect(clickLabeledPageAction(/^new\b/i)).toBe(false);
  });
});
