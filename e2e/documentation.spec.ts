import { expect, test } from "@playwright/test";

import { signIn } from "./helpers/auth";

test.describe("documentation", () => {
  test("shows Documentation in sidebar for signed-in users", async ({ page }) => {
    await signIn(page);
    await expect(page.getByRole("button", { name: "Documentation" })).toBeVisible();
  });

  test("navigates home to a dedicated article page", async ({ page }) => {
    await signIn(page);
    await page.goto("/docs");
    await expect(page.getByRole("heading", { name: "Documentation", exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Quotations" }).first().click();
    await expect(page).toHaveURL(/\/docs\/sales\/quotations$/);
    await expect(page.getByRole("heading", { name: "Quotations", exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Previous and next pages" })).toBeVisible();
  });

  test("searches documentation from home", async ({ page }) => {
    await signIn(page);
    await page.goto("/docs");
    await page.getByLabel("Search documentation").fill("quotation");
    await expect(page.getByRole("link", { name: "Quotations" }).first()).toBeVisible();
  });

  test("returns 404 for unknown doc slug", async ({ page }) => {
    await signIn(page);
    await page.goto("/docs/sales/not-a-real-page");
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });

  test("opens browse topics sheet on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page);
    await page.goto("/docs/sales/quotations");
    await page.getByRole("button", { name: "Topics" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("link", { name: "Stock concepts" }).click();
    await expect(page).toHaveURL(/\/docs\/inventory/);
  });

  test("help dialog links to documentation", async ({ page }) => {
    await signIn(page);
    await page.goto("/quotations");
    await page.getByRole("button", { name: "Help" }).click();
    await expect(page.getByRole("link", { name: "Open documentation" })).toBeVisible();
    await expect(page.getByText("Help for this page")).toBeVisible();
  });

  test("command palette finds documentation", async ({ page }) => {
    await signIn(page);
    await page.goto("/docs");
    await page.keyboard.press("Meta+k");
    await page.getByLabel("Search pages").fill("grni");
    await expect(page.getByText(/Docs:/)).toBeVisible();
  });
});
