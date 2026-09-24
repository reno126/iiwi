import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  FormFieldCard,
  FORM_FIELD_CARD_MESSAGES,
} from "@/components/ui/form-field-card";
import { PRODUCT_ERRORS } from "@/schemas/product";

const TEST_MESSAGES = {
  label: "Przykładowe pole",
  childText: "Zawartość pola formularza",
  errorMessage: PRODUCT_ERRORS.nameRequired,
  statusFilled: FORM_FIELD_CARD_MESSAGES.statusFilled,
  statusMissing: FORM_FIELD_CARD_MESSAGES.statusMissing,
} as const;

describe("components/ui/form-field-card", () => {
  it("renders label and children without status badge when showStatus is false", () => {
    render(
      <FormFieldCard label={TEST_MESSAGES.label}>
        <input id="sample-input" />
      </FormFieldCard>,
    );

    expect(screen.getByText(TEST_MESSAGES.label)).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(
      screen.queryByText(TEST_MESSAGES.statusFilled),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(TEST_MESSAGES.statusMissing),
    ).not.toBeInTheDocument();
  });

  it("renders status badge as filled when showStatus is true and isFilled is true", () => {
    render(
      <FormFieldCard
        label={TEST_MESSAGES.label}
        showStatus={true}
        isFilled={true}
      >
        <input id="sample-input" />
      </FormFieldCard>,
    );

    expect(screen.getByText(TEST_MESSAGES.statusFilled)).toBeInTheDocument();
    expect(
      screen.queryByText(TEST_MESSAGES.statusMissing),
    ).not.toBeInTheDocument();
  });

  it("renders status badge as missing when showStatus is true and isFilled is false", () => {
    render(
      <FormFieldCard
        label={TEST_MESSAGES.label}
        showStatus={true}
        isFilled={false}
      >
        <input id="sample-input" />
      </FormFieldCard>,
    );

    expect(screen.getByText(TEST_MESSAGES.statusMissing)).toBeInTheDocument();
    expect(
      screen.queryByText(TEST_MESSAGES.statusFilled),
    ).not.toBeInTheDocument();
  });

  it("renders error message when error prop is provided", () => {
    render(
      <FormFieldCard
        label={TEST_MESSAGES.label}
        error={TEST_MESSAGES.errorMessage}
      >
        <input id="sample-input" />
      </FormFieldCard>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      TEST_MESSAGES.errorMessage,
    );
  });

  it("renders reserved space container when reserveSpace is true without error", () => {
    render(
      <FormFieldCard label={TEST_MESSAGES.label} reserveSpace={true}>
        <input id="sample-input" />
      </FormFieldCard>,
    );

    expect(
      screen.getByText("\u00A0", { normalizer: (text) => text }),
    ).toBeInTheDocument();
  });
});
