import { test, expect } from "@playwright/test";

test("user reaches the local game setup from the home page", async ({ page }) => {
  await page.goto("/");

  // Home renders both entry points
  await expect(page.getByRole("heading", { name: /replacle/i })).toBeVisible();
  await page.getByRole("button", { name: /pass and play/i }).click();
  await expect(page).toHaveURL(/\/game\/local\/join$/);

  // Start Game unlocks only when both player names are entered
  const start = page.getByRole("button", { name: /start game/i });
  await expect(start).toBeDisabled();
  await page.getByLabel(/player 1 name/i).fill("Alice");
  await page.getByLabel(/player 2 name/i).fill("Bob");
  await expect(start).toBeEnabled();
});
