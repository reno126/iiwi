import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider } from "react-hook-form";
import {
  ReviewFields,
  REVIEW_FIELDS_MESSAGES,
} from "@/components/reviews/ReviewFields";
import { ReviewRatingField } from "@/components/reviews/ReviewRatingField";
import { ReviewDescriptionField } from "@/components/reviews/ReviewDescriptionField";
import { RATING_INPUT_MESSAGES } from "@/components/reviews/RatingInput";
import type { ReviewCreateInput } from "@/schemas/review";

interface FormWrapperProps {
  defaultValues?: Partial<ReviewCreateInput>;
  children?: React.ReactNode;
}

function ReviewFormWrapper({ defaultValues, children }: FormWrapperProps) {
  const methods = useForm<ReviewCreateInput>({
    defaultValues: {
      rate: 0,
      description: "",
      productId: "prod-1",
      ...defaultValues,
    },
  });

  return (
    <FormProvider {...methods}>
      <form>{children ?? <ReviewFields />}</form>
    </FormProvider>
  );
}

describe("components/reviews/ReviewFields", () => {
  it("renders both rating input and review description textarea", () => {
    render(<ReviewFormWrapper />);

    expect(screen.getByText(REVIEW_FIELDS_MESSAGES.legend)).toBeInTheDocument();
    expect(
      screen.getByText(REVIEW_FIELDS_MESSAGES.rateLabel),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(REVIEW_FIELDS_MESSAGES.descriptionLabel),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        REVIEW_FIELDS_MESSAGES.descriptionPlaceholder,
      ),
    ).toBeInTheDocument();
  });

  it("updates rating value when clicking star radio button", async () => {
    const user = userEvent.setup();
    render(<ReviewFormWrapper />);

    const star4 = screen.getByRole("radio", {
      name: RATING_INPUT_MESSAGES.starAriaLabel(4),
    });
    expect(star4).not.toBeChecked();

    await user.click(star4);

    expect(star4).toBeChecked();
  });

  it("updates description input value when user types", async () => {
    const user = userEvent.setup();
    render(<ReviewFormWrapper />);

    const textarea = screen.getByLabelText(
      REVIEW_FIELDS_MESSAGES.descriptionLabel,
    );
    await user.type(textarea, "Bardzo dobry produkt");

    expect(textarea).toHaveValue("Bardzo dobry produkt");
  });

  it("renders standalone ReviewRatingField within FormProvider", () => {
    render(
      <ReviewFormWrapper>
        <ReviewRatingField />
      </ReviewFormWrapper>,
    );

    expect(
      screen.getByText(REVIEW_FIELDS_MESSAGES.rateLabel),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", {
        name: RATING_INPUT_MESSAGES.starAriaLabel(5),
      }),
    ).toBeInTheDocument();
  });

  it("renders standalone ReviewDescriptionField within FormProvider", () => {
    render(
      <ReviewFormWrapper>
        <ReviewDescriptionField />
      </ReviewFormWrapper>,
    );

    expect(
      screen.getByLabelText(REVIEW_FIELDS_MESSAGES.descriptionLabel),
    ).toBeInTheDocument();
  });
});
