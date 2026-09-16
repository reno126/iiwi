import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider } from "react-hook-form";
import { ProductNameField } from "@/app/opinie/dodaj/_components/fields/ProductNameField";
import { ProductCodeField } from "@/app/opinie/dodaj/_components/fields/ProductCodeField";
import { ProductImageField } from "@/app/opinie/dodaj/_components/fields/ProductImageField";
import { ProductUrlField } from "@/app/opinie/dodaj/_components/fields/ProductUrlField";
import { PRODUCT_FIELDS_MESSAGES } from "@/app/opinie/dodaj/_components/ProductFields";
import { productScrapeMetadata } from "@/serverActions/productScrapeMetadata";
import { shopMatchByUrlAction } from "@/serverActions/shopMatchByUrlAction";
import type { ProductCreateInput } from "@/schemas/product";

vi.mock("@/serverActions/productScrapeMetadata", () => ({
  productScrapeMetadata: vi.fn(),
}));

vi.mock("@/serverActions/shopMatchByUrlAction", () => ({
  shopMatchByUrlAction: vi.fn().mockResolvedValue(null),
}));

interface FormWrapperProps {
  defaultValues?: Partial<ProductCreateInput>;
  children: React.ReactNode;
}

function ProductFormWrapper({ defaultValues, children }: FormWrapperProps) {
  const methods = useForm<ProductCreateInput>({
    defaultValues: {
      name: "",
      productUrl: "",
      imageUrl: "",
      code: "",
      shopId: "",
      ...defaultValues,
    },
  });

  return (
    <FormProvider {...methods}>
      <form>{children}</form>
    </FormProvider>
  );
}

describe("app/opinie/dodaj/_components/fields (Atomic Fields)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ProductNameField", () => {
    it("renders name textarea and updates status when filled", async () => {
      const user = userEvent.setup();
      render(
        <ProductFormWrapper>
          <ProductNameField showStatus={true} />
        </ProductFormWrapper>
      );

      expect(screen.getByText(PRODUCT_FIELDS_MESSAGES.statusMissing)).toBeInTheDocument();

      const input = screen.getByLabelText(PRODUCT_FIELDS_MESSAGES.nameLabel);
      await user.type(input, "Klawiatura mechaniczna");

      await waitFor(() => {
        expect(screen.getByText(PRODUCT_FIELDS_MESSAGES.statusFilled)).toBeInTheDocument();
      });
    });
  });

  describe("ProductCodeField", () => {
    it("renders code input and updates status when filled", async () => {
      const user = userEvent.setup();
      render(
        <ProductFormWrapper>
          <ProductCodeField showStatus={true} />
        </ProductFormWrapper>
      );

      expect(screen.getByText(PRODUCT_FIELDS_MESSAGES.statusMissing)).toBeInTheDocument();

      const input = screen.getByLabelText(PRODUCT_FIELDS_MESSAGES.codeLabel);
      await user.type(input, "1234567890123");

      await waitFor(() => {
        expect(screen.getByText(PRODUCT_FIELDS_MESSAGES.statusFilled)).toBeInTheDocument();
      });
    });
  });

  describe("ProductImageField", () => {
    it("renders url input when imageUrl is empty", () => {
      render(
        <ProductFormWrapper>
          <ProductImageField />
        </ProductFormWrapper>
      );

      expect(screen.getByLabelText(PRODUCT_FIELDS_MESSAGES.imageUrlLabel)).toBeInTheDocument();
      expect(screen.queryByText(PRODUCT_FIELDS_MESSAGES.imagePreviewAlt)).not.toBeInTheDocument();
    });

    it("renders preview card and allows removing image via delete button", async () => {
      const user = userEvent.setup();
      render(
        <ProductFormWrapper
          defaultValues={{
            imageUrl: "https://example.com/test.jpg",
          }}
        >
          <ProductImageField />
        </ProductFormWrapper>
      );

      expect(screen.queryByLabelText(PRODUCT_FIELDS_MESSAGES.imageUrlLabel)).not.toBeInTheDocument();
      expect(screen.getByText(PRODUCT_FIELDS_MESSAGES.imagePreviewAlt)).toBeInTheDocument();

      const deleteBtn = screen.getByRole("button", {
        name: PRODUCT_FIELDS_MESSAGES.deleteImageButton,
      });
      await user.click(deleteBtn);

      expect(screen.getByLabelText(PRODUCT_FIELDS_MESSAGES.imageUrlLabel)).toBeInTheDocument();
      expect(screen.queryByText(PRODUCT_FIELDS_MESSAGES.imagePreviewAlt)).not.toBeInTheDocument();
    });
  });

  describe("ProductUrlField", () => {
    it("disables scrape button when productUrl is empty", () => {
      render(
        <ProductFormWrapper>
          <ProductUrlField />
        </ProductFormWrapper>
      );

      const scrapeBtn = screen.getByRole("button", {
        name: PRODUCT_FIELDS_MESSAGES.scrapeButton,
      });
      expect(scrapeBtn).toBeDisabled();
    });

    it("enables scrape button when url is entered and triggers scrape", async () => {
      const user = userEvent.setup();
      const onScrapeFinished = vi.fn();
      vi.mocked(productScrapeMetadata).mockResolvedValueOnce({
        data: {
          imageUrl: "https://example.com/item.jpg",
          name: "Test Name",
          code: "1234",
          shop: null,
          scrapedFields: ["name", "imageUrl"],
        },
      });

      render(
        <ProductFormWrapper>
          <ProductUrlField onScrapeFinished={onScrapeFinished} />
        </ProductFormWrapper>
      );

      const urlInput = screen.getByLabelText(PRODUCT_FIELDS_MESSAGES.productUrlLabel);
      await user.type(urlInput, "https://example.com/item");

      const scrapeBtn = screen.getByRole("button", {
        name: PRODUCT_FIELDS_MESSAGES.scrapeButton,
      });
      expect(scrapeBtn).toBeEnabled();

      await user.click(scrapeBtn);

      await waitFor(() => {
        expect(productScrapeMetadata).toHaveBeenCalledWith({
          productUrl: "https://example.com/item",
        });
        expect(onScrapeFinished).toHaveBeenCalled();
      });
    });

    it("calls shopMatchByUrlAction on url blur when shop is not selected", async () => {
      const user = userEvent.setup();
      const onShopMatched = vi.fn();
      vi.mocked(shopMatchByUrlAction).mockResolvedValueOnce({
        data: {
          id: "shop-1",
          name: "Morele.net",
          logo: "https://example.com/morele.png",
        },
      });

      render(
        <ProductFormWrapper>
          <ProductUrlField onShopMatched={onShopMatched} />
        </ProductFormWrapper>
      );

      const urlInput = screen.getByLabelText(PRODUCT_FIELDS_MESSAGES.productUrlLabel);
      await user.type(urlInput, "https://morele.net/item-123");
      await user.tab();

      await waitFor(() => {
        expect(shopMatchByUrlAction).toHaveBeenCalledWith({
          url: "https://morele.net/item-123",
        });
        expect(onShopMatched).toHaveBeenCalledWith({
          id: "shop-1",
          name: "Morele.net",
          logo: "https://example.com/morele.png",
        });
      });
    });

    it("renders hidden input when hideProductUrl is true", () => {
      const { container } = render(
        <ProductFormWrapper>
          <ProductUrlField hideProductUrl={true} />
        </ProductFormWrapper>
      );

      expect(screen.queryByLabelText(PRODUCT_FIELDS_MESSAGES.productUrlLabel)).not.toBeInTheDocument();
      const hiddenInput = container.querySelector("input[type='hidden'][name='productUrl']");
      expect(hiddenInput).toBeInTheDocument();
    });
  });
});
