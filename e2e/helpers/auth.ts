import { expect, type Page } from "@playwright/test";

const TENANT = process.env.NEXT_PUBLIC_ORGANIZATION_NAME ?? "Plumbit";
const EMAIL = process.env.E2E_EMAIL ?? "ada@plumbit.com";
const PASSWORD = process.env.E2E_PASSWORD ?? "correct-horse";

async function waitForFirstOrganization(page: Page) {
  await expect(page.getByRole("combobox", { name: "Organization" })).toHaveText(TENANT);
}

export async function signIn(page: Page, email = EMAIL, password = PASSWORD) {
  await page.goto("/login");
  await waitForFirstOrganization(page);
  await page.getByLabel("Company Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

export async function signInAsReader(page: Page) {
  await signIn(page, "reader@plumbit.com", PASSWORD);
}
