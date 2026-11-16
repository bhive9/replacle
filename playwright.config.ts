import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3002",
  },
  // CI serves the production build; locally reuse the user's dev server on :3002.
  webServer: {
    command: process.env.CI ? "npm run start -- --port 3002" : "npm run dev -- --port 3002",
    url: "http://localhost:3002",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
