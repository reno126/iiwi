import { test, expect } from "@playwright/test";
import { prisma } from "@/lib/db/prisma";
import {
  E2E_TEST_PREFIX,
  waitForHydration,
  createAuthenticatedSession,
  deleteTestUser,
} from "./helpers/auth";
import { DASHBOARD_MESSAGES } from "@/app/dashboard/constants";
import { SIGN_IN_MESSAGES } from "@/app/login/constants";
import { REGISTER_MESSAGES } from "@/app/register/constants";
import { LOGIN_ERRORS } from "@/schemas/login";
import { REGISTER_API_MESSAGES, REGISTER_ERRORS } from "@/schemas/register";

test.describe("Authentication and Route Protection Flows", () => {
  test("redirects unauthenticated user from /dashboard to /login with callbackUrl", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fdashboard/);
    await expect(
      page.getByRole("heading", { name: SIGN_IN_MESSAGES.title }),
    ).toBeVisible();
  });

  test("shows client-side validation errors on /register when submitting empty form", async ({
    page,
  }) => {
    await page.goto("/register");
    await waitForHydration(page);

    await page
      .getByRole("button", { name: REGISTER_MESSAGES.submitButton })
      .click();

    await expect(page.getByLabel(REGISTER_MESSAGES.nameLabel)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByLabel(REGISTER_MESSAGES.emailLabel)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(
      page.getByLabel(REGISTER_MESSAGES.passwordLabel),
    ).toHaveAttribute("aria-invalid", "true");

    await expect(page.getByText(REGISTER_ERRORS.nameMinLength)).toBeVisible();
    await expect(page.getByText(REGISTER_ERRORS.invalidEmail)).toBeVisible();
    await expect(
      page.getByText(REGISTER_ERRORS.passwordMinLength),
    ).toBeVisible();
  });

  test("completes registration flow and automatically logs in to dashboard", async ({
    page,
  }) => {
    const uniqueEmail = `${E2E_TEST_PREFIX}user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`;

    try {
      await page.goto("/register");
      await waitForHydration(page);

      await page
        .getByLabel(REGISTER_MESSAGES.nameLabel)
        .fill(`${E2E_TEST_PREFIX} Testowy Użytkownik`);
      await page.getByLabel(REGISTER_MESSAGES.emailLabel).fill(uniqueEmail);
      await page
        .getByLabel(REGISTER_MESSAGES.passwordLabel)
        .fill("bezpieczneHaslo123");

      await page
        .getByRole("button", { name: REGISTER_MESSAGES.submitButton })
        .click();

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

      await page
        .getByLabel(REGISTER_MESSAGES.nameLabel)
        .fill(`${E2E_TEST_PREFIX} Drugi Użytkownik`);
      await page.getByLabel(REGISTER_MESSAGES.emailLabel).fill(duplicateEmail);
      await page
        .getByLabel(REGISTER_MESSAGES.passwordLabel)
        .fill("inneHaslo12345");
      await page
        .getByRole("button", { name: REGISTER_MESSAGES.submitButton })
        .click();

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
      .getByRole("button", {
        name: SIGN_IN_MESSAGES.submitButton,
        exact: true,
      })
      .click();

    await expect(page.getByLabel(SIGN_IN_MESSAGES.emailLabel)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(
      page.getByLabel(SIGN_IN_MESSAGES.passwordLabel),
    ).toHaveAttribute("aria-invalid", "true");

    await expect(page.getByText(LOGIN_ERRORS.invalidEmail)).toBeVisible();
    await expect(page.getByText(LOGIN_ERRORS.passwordRequired)).toBeVisible();
  });

  test("allows authenticated user to log out from dashboard and clears protected access", async ({
    context,
    page,
  }) => {
    const authedUser = await createAuthenticatedSession(context);

    try {
      await page.goto("/dashboard");
      await waitForHydration(page);

      await expect(
        page.getByRole("heading", {
          name: new RegExp(DASHBOARD_MESSAGES.greetingPrefix, "i"),
        }),
      ).toBeVisible();

      await page
        .getByRole("button", { name: DASHBOARD_MESSAGES.signOutButton })
        .click();

      await expect(page).toHaveURL(/\/login/);

      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fdashboard/);
    } finally {
      await deleteTestUser(authedUser.id);
    }
  });
});
