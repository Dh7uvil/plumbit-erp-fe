import { expect, test, type Page } from "@playwright/test";

const TENANT = process.env.NEXT_PUBLIC_ORGANIZATION_NAME ?? "Plumbit";
const EMAIL = "ada@plumbit.com";
const PASSWORD = "correct-horse";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function waitForFirstOrganization(page: Page) {
  await expect(page.getByRole("combobox", { name: "Organization" })).toHaveText(TENANT);
}

async function signIn(page: Page) {
  await page.goto("/login");
  await waitForFirstOrganization(page);
  await page.getByLabel("Company Email").fill(EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

test.describe("organization logo", () => {
  test("login picker still works without a company logo", async ({ page }) => {
    await page.goto("/login");
    await waitForFirstOrganization(page);
    await page.getByRole("combobox", { name: "Organization" }).click();
    await expect(page.getByRole("option", { name: TENANT })).toBeVisible();
  });

  test("uploads and shows the company logo on login and in the sidebar", async ({ page }) => {
    await signIn(page);
    await page.goto("/organization-settings");
    await expect(page.getByRole("heading", { name: "Organization Settings" })).toBeVisible();
    await expect(page.getByText("No company logo yet")).toBeVisible();

    await page.getByLabel("Upload company logo").setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: PNG,
    });
    await expect(page.getByRole("img", { name: "Company logo" })).toBeVisible();
    await expect(page.locator("aside").getByRole("img", { name: TENANT })).toBeVisible();

    await page.getByRole("button", { name: /Account menu for Ada Lovelace/ }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page.getByRole("heading", { name: "Sign in to your account" })).toBeVisible();
    await expect(page.getByRole("img", { name: TENANT })).toBeVisible();

    await signIn(page);
    await page.goto("/organization-settings");
    await page.getByRole("button", { name: "Remove logo" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog.getByRole("heading", { name: "Remove company logo" })).toBeVisible();
    await dialog.getByRole("button", { name: "Remove logo" }).click();
    await expect(page.getByText("No company logo yet")).toBeVisible();
  });
});
