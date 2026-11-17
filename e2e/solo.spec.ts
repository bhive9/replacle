import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

// Solo mode is entirely on-device, so this flow needs no Redis and runs in CI.
const dictionary = new Set(
  readFileSync("public/data/dictionary-4.txt", "utf8").split("\n").filter(Boolean)
);

function shortestLadder(start: string, target: string): string[] {
  const visited = new Set([start]);
  const queue: Array<{ word: string; path: string[] }> = [{ word: start, path: [start] }];
  while (queue.length) {
    const { word, path } = queue.shift()!;
    for (let i = 0; i < word.length; i++) {
      for (const letter of "abcdefghijklmnopqrstuvwxyz") {
        if (letter === word[i]) continue;
        const candidate = word.slice(0, i) + letter + word.slice(i + 1);
        if (!dictionary.has(candidate) || visited.has(candidate)) continue;
        const nextPath = [...path, candidate];
        if (candidate === target) return nextPath;
        visited.add(candidate);
        queue.push({ word: candidate, path: nextPath });
      }
    }
  }
  throw new Error(`no ladder from ${start} to ${target}`);
}

test("player solves a solo puzzle from start to target", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /solo challenge/i }).click();
  await expect(page).toHaveURL(/\/game\/solo$/);

  // Read the generated puzzle from the start/target panel
  await page.getByText("Target", { exact: true }).waitFor();
  const start = await page
    .getByText("Start", { exact: true })
    .locator("..")
    .locator("h3")
    .innerText();
  const target = await page
    .getByText("Target", { exact: true })
    .locator("..")
    .locator("h3")
    .innerText();
  expect(start).not.toBe(target);

  // A reload must not lose the run (localStorage persistence)
  const ladder = shortestLadder(start.toLowerCase(), target.toLowerCase());
  const input = page.getByLabel(/your word/i);
  const historyLog = page.getByRole("log", { name: /move history/i });
  await input.fill(ladder[1]);
  await input.press("Enter");
  await expect(historyLog.getByText(new RegExp(ladder[1], "i"))).toBeVisible();
  await page.reload();
  await expect(historyLog.getByText(new RegExp(ladder[1], "i"))).toBeVisible();

  // Solve the rest of the ladder to the win screen
  for (const word of ladder.slice(2)) {
    await input.fill(word);
    await input.press("Enter");
  }
  await expect(page.getByText(new RegExp(`you made it to ${target}`, "i"))).toBeVisible();
  await expect(page.getByText(/solved in/i)).toBeVisible();
  await page.getByRole("button", { name: /new puzzle/i }).click();
  await expect(page.getByText("Target", { exact: true })).toBeVisible();
});
