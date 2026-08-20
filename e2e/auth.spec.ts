import { expect, test, type Page } from "@playwright/test";

const TENANT = process.env.NEXT_PUBLIC_ORGANIZATION_NAME ?? "Plumbit";
const EMAIL = "ada@plumbit.com";
const PASSWORD = "correct-horse";

async function waitForFirstOrganization(page: Page) {
  await expect(page.getByRole("combobox", { name: "Organization" })).toHaveText(TENANT);
}

async function selectOrganization(page: Page) {
  const combobox = page.getByRole("combobox", { name: "Organization" });
  await expect(combobox).toBeEnabled();
  await combobox.click();
  await page.getByRole("option", { name: TENANT }).click();
}

async function signIn(page: Page, password = PASSWORD) {
  await page.goto("/login");
  await waitForFirstOrganization(page);
  await page.getByLabel("Company Email").fill(EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
}

test.describe("auth", () => {
  test("shows mapped error on invalid credentials", async ({ page }) => {
    await signIn(page, "wrong-password");
    await expect(page.getByText("Invalid email or password. Please try again.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("signs in and lands on the home placeholder", async ({ page }) => {
    await signIn(page);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Ada Lovelace")).toBeVisible();
  });

  test("remember me sets a longer refresh cookie", async ({ page, context }) => {
    await page.goto("/login");
    await waitForFirstOrganization(page);
    await page.getByLabel("Company Email").fill(EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByLabel("Remember me").click();
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    const remembered = (await context.cookies()).find((cookie) => cookie.name === "pb_refresh");
    expect(remembered?.expires ?? -1).toBeGreaterThan(Date.now() / 1000 + 60 * 60 * 24);

    await context.clearCookies();
    await page.goto("/login");
    await waitForFirstOrganization(page);
    await page.getByLabel("Company Email").fill(EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    const session = (await context.cookies()).find((cookie) => cookie.name === "pb_refresh");
    expect(session?.expires ?? -1).toBeLessThan(0);
  });

  test("signs out and returns to login", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: /Account menu for Ada Lovelace/ }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page.getByRole("heading", { name: "Sign in to your account" })).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("changes password from the authenticated header", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: /Account menu for Ada Lovelace/ }).click();
    await page.getByRole("menuitem", { name: "Change password" }).click();
    await page.getByLabel("Current Password").fill(PASSWORD);
    await page.getByLabel("New Password", { exact: true }).fill("new-horse-battery");
    await page.getByLabel("Confirm New Password").fill("new-horse-battery");
    await page.getByRole("button", { name: "Update Password" }).click();
    await expect(page.getByText("Password changed successfully")).toBeVisible();
  });

  test("forgot password shows a generic confirmation", async ({ page }) => {
    await page.goto("/forgot-password");
    await selectOrganization(page);
    await page.getByLabel("Company Email").fill(EMAIL);
    await page.getByRole("button", { name: "Send Reset Link" }).click();
    await expect(
      page.getByText("If an account exists for that email, we sent reset instructions."),
    ).toBeVisible();
  });

  test("reset password without a token shows a mapped error", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByText("This reset link is invalid. Request a new one.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset Password" })).toBeDisabled();
  });

  test("reset password with a token returns to login", async ({ page }) => {
    await page.goto("/reset-password?token=valid-reset-token");
    await page.getByLabel("New Password").fill("reset-horse-battery");
    await page.getByLabel("Confirm Password").fill("reset-horse-battery");
    await page.getByRole("button", { name: "Reset Password" }).click();
    await expect(page.getByRole("heading", { name: "Sign in to your account" })).toBeVisible();
  });
});
