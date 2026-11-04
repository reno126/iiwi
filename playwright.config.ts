import { defineConfig, devices } from "@playwright/test";
import { getE2eDatabaseUrl } from "./tests/e2e/helpers/environment";

const connectionString = getE2eDatabaseUrl();
process.env.DATABASE_URL = connectionString;
process.env.E2E_DATABASE_URL = connectionString;

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/globalSetup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  timeout: 30 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: process.env.CI ? "pnpm start" : "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    env: {
      DATABASE_URL: connectionString,
      E2E_DATABASE_URL: connectionString,
      NEXTAUTH_URL: "http://localhost:3000",
    },
    timeout: 120 * 1000,
  },
});
