import { test, expect } from "@playwright/test";
import {
  createAuthenticatedSession,
  deleteTestUser,
  E2E_TEST_PREFIX,
  waitForHydration,
  type TestUser,
} from "./helpers/auth";
import { ADD_REVIEW_FLOW_MESSAGES } from "@/app/opinie/dodaj/_components/addReviewFlowMessages";
import { COMBINED_FORM_MESSAGES } from "@/app/opinie/dodaj/_components/combinedFormMessages";
import { URL_PROMPT_MESSAGES } from "@/app/opinie/dodaj/_components/urlPromptMessages";
import { PRODUCT_FIELDS_MESSAGES } from "@/app/opinie/dodaj/_components/productFieldsMessages";
import { RATING_INPUT_MESSAGES } from "@/components/reviews/ratingInputMessages";
import { REVIEW_FIELDS_MESSAGES } from "@/components/reviews/reviewFieldsMessages";
import { PRODUCT_ERRORS } from "@/schemas/product";

test.describe("Product Creation Flow (End-to-End)", () => {
  let authedUser: TestUser;

  test.beforeEach(async ({ context }) => {
    authedUser = await createAuthenticatedSession(context);
  });

  test.afterEach(async () => {
    if (authedUser?.id) {
      await deleteTestUser(authedUser.id);
    }
  });

  test("authenticated user can navigate to /opinie/dodaj, fill form, and create product", async ({
    page,
  }) => {
    const timestamp = Date.now();

    await page.goto("/opinie/dodaj");
    await waitForHydration(page);
    await expect(page).toHaveURL(/\/opinie\/dodaj/);

    await page
      .getByRole("button", {
        name: ADD_REVIEW_FLOW_MESSAGES.addNewProductButton,
      })
      .click();

    await expect(
      page.getByRole("heading", {
        name: COMBINED_FORM_MESSAGES.urlPromptTitle,
      }),
    ).toBeVisible();
    await expect(page.getByText(URL_PROMPT_MESSAGES.subtitle)).toBeVisible();

    await page
      .getByRole("button", { name: URL_PROMPT_MESSAGES.manualButton })
      .click();

    const productName = `${E2E_TEST_PREFIX} Produkt E2E ${timestamp}`;
    await page.getByLabel(PRODUCT_FIELDS_MESSAGES.nameLabel).fill(productName);
    await page
      .getByLabel(PRODUCT_FIELDS_MESSAGES.codeLabel)
      .fill(`${E2E_TEST_PREFIX}SKU-${timestamp.toString().slice(-6)}`);

    await page
      .getByRole("radio", { name: RATING_INPUT_MESSAGES.starAriaLabel(5) })
      .click();
    await page
      .getByLabel(REVIEW_FIELDS_MESSAGES.descriptionLabel)
      .fill("Świetny testowy produkt E2E!");

    await page
      .getByRole("button", { name: COMBINED_FORM_MESSAGES.submitLabel })
      .click();

    await expect(page).toHaveURL(/\/produkty\/.+/);
    await expect(
      page.getByRole("heading", { name: new RegExp(productName, "i") }),
    ).toBeVisible();
  });

  test("shows client validation errors when trying to create product with invalid name", async ({
    page,
  }) => {
    await page.goto("/opinie/dodaj");
    await waitForHydration(page);
    await page
      .getByRole("button", {
        name: ADD_REVIEW_FLOW_MESSAGES.addNewProductButton,
      })
      .click();

    await page
      .getByRole("button", { name: URL_PROMPT_MESSAGES.manualButton })
      .click();

    await page.getByLabel(PRODUCT_FIELDS_MESSAGES.nameLabel).fill("AB");
    await page
      .getByRole("button", { name: COMBINED_FORM_MESSAGES.submitLabel })
      .click();

    await expect(
      page.getByLabel(PRODUCT_FIELDS_MESSAGES.nameLabel),
    ).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText(PRODUCT_ERRORS.nameMinLength)).toBeVisible();
  });
});
