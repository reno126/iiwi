import { test, expect } from "@playwright/test";
import { prisma } from "@/lib/db/prisma";
import { E2E_TEST_PREFIX, waitForHydration } from "./helpers/auth";
import { DASHBOARD_MESSAGES } from "@/app/dashboard/constants";
import { REGISTER_API_MESSAGES } from "@/schemas/register";

test.describe("Authentication and Route Protection Flows", () => {
  test("redirects unauthenticated user from /dashboard to /login with callbackUrl", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fdashboard/);
    await expect(
      page.getByRole("heading", { name: /zaloguj się/i }),
    ).toBeVisible();
  });

  test("shows client-side validation errors on /register when submitting empty form", async ({
    page,
  }) => {
    await page.goto("/register");
    await waitForHydration(page);

    await page.getByRole("button", { name: /zarejestruj się/i }).click();

    await expect(page.getByLabel(/Imię/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByLabel(/Adres e-mail/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByLabel(/Hasło/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  test("completes registration flow and automatically logs in to dashboard", async ({
    page,
  }) => {
    const uniqueEmail = `${E2E_TEST_PREFIX}user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`;

    try {
      await page.goto("/register");
      await waitForHydration(page);

      await page.getByLabel(/Imię/i).fill(`${E2E_TEST_PREFIX} Testowy Użytkownik`);
      await page.getByLabel(/Adres e-mail/i).fill(uniqueEmail);
      await page.getByLabel(/Hasło/i).fill("bezpieczneHaslo123");

      await page.getByRole("button", { name: /zarejestruj się/i }).click();

      await expect(page).toHaveURL(/\/dashboard/);
      await expect(
        page.getByRole("heading", {
          name: new RegExp(DASHBOARD_MESSAGES.greetingPrefix, "i"),
        }),
      ).toBeVisible();
    } finally {
      await prisma.user.deleteMany({
        where: { email: uniqueEmail },
      });
    }
  });

  test("shows conflict error when attempting to register with already registered email", async ({
    page,
  }) => {
    const duplicateEmail = `${E2E_TEST_PREFIX}dup_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`;

    try {
      await prisma.user.create({
        data: {
          email: duplicateEmail,
          name: `${E2E_TEST_PREFIX} Istniejący Użytkownik`,
          password: "bezpieczneHaslo123",
        },
      });

      await page.goto("/register");
      await waitForHydration(page);

      await page.getByLabel(/Imię/i).fill(`${E2E_TEST_PREFIX} Drugi Użytkownik`);
      await page.getByLabel(/Adres e-mail/i).fill(duplicateEmail);
      await page.getByLabel(/Hasło/i).fill("inneHaslo12345");
      await page.getByRole("button", { name: /zarejestruj się/i }).click();

      await expect(
        page.getByText(REGISTER_API_MESSAGES.emailTaken),
      ).toBeVisible();
    } finally {
      await prisma.user.deleteMany({
        where: { email: duplicateEmail },
      });
    }
  });

  test("shows validation errors on /login when submitting empty fields", async ({
    page,
  }) => {
    await page.goto("/login");
    await waitForHydration(page);

    await page
      .getByRole("button", { name: /^zaloguj się$/i })
      .click();

    await expect(page.getByLabel(/Adres e-mail/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByLabel(/Hasło/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
