import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider } from "react-hook-form";
import { ProductFields } from "@/app/opinie/dodaj/_components/ProductFields";
import { productScrapeMetadata } from "@/serverActions/productScrapeMetadata";
import type { ProductCreateInput } from "@/schemas/product";

vi.mock("@/serverActions/productScrapeMetadata", () => ({
  productScrapeMetadata: vi.fn(),
}));

vi.mock("@/serverActions/shopMatchByUrlAction", () => ({
  shopMatchByUrlAction: vi.fn().mockResolvedValue(null),
}));

interface WrapperProps {
  defaultValues?: Partial<ProductCreateInput>;
  hideProductUrl?: boolean;
  showFieldStatus?: boolean;
}

function FormWrapper({ defaultValues, hideProductUrl, showFieldStatus }: WrapperProps) {
  const methods = useForm<ProductCreateInput>({
    defaultValues: {
      name: "",
      productUrl: "",
      imageUrl: "",
      code: "",
      ...defaultValues,
    },
  });

  return (
    <FormProvider {...methods}>
      <form>
        <ProductFields
          hideProductUrl={hideProductUrl}
          showFieldStatus={showFieldStatus}
        />
      </form>
    </FormProvider>
  );
}

function createProductFieldsDriver() {
  const user = userEvent.setup();
  return {
    user,
    nameInput: () => screen.getByLabelText(/nazwa produktu/i),
    productUrlInput: () => screen.getByLabelText(/adres url do produktu/i),
    queryProductUrlInput: () => screen.queryByLabelText(/adres url do produktu/i),
    imageUrlInput: () => screen.getByLabelText(/adres url zdjęcia/i),
    queryImageUrlInput: () => screen.queryByLabelText(/adres url zdjęcia/i),
    codeInput: () => screen.getByLabelText(/kod produktu/i),
    scrapeButton: () =>
      screen.getByRole("button", { name: /wyciągnij zdjęcie produktu/i }),
    deleteImageButton: () =>
      screen.getByRole("button", { name: /usuń/i }),
    statusBadges: (label: RegExp | string) => screen.getAllByText(label),
  };
}

describe("app/opinie/dodaj/_components/ProductFields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders product fields and disables scrape button when productUrl is empty", () => {
    render(<FormWrapper />);
    const driver = createProductFieldsDriver();

    expect(driver.nameInput()).toBeInTheDocument();
    expect(driver.productUrlInput()).toBeInTheDocument();
    expect(driver.imageUrlInput()).toBeInTheDocument();
    expect(driver.codeInput()).toBeInTheDocument();
    expect(driver.scrapeButton()).toBeDisabled();
  });

  it("enables scrape button when productUrl is filled and fills fields on success", async () => {
    vi.mocked(productScrapeMetadata).mockResolvedValueOnce({
      data: {
        imageUrl: "https://example.com/scraped-image.jpg",
        name: "Pobrana Nazwa Produktu",
        code: "EAN-123456",
        shop: null,
        scrapedFields: ["name", "imageUrl", "code"],
      },
    });

    render(<FormWrapper />);
    const driver = createProductFieldsDriver();

    await driver.user.type(driver.productUrlInput(), "https://example.com/item");
    expect(driver.scrapeButton()).toBeEnabled();

    await driver.user.click(driver.scrapeButton());

    await waitFor(() => {
      expect(productScrapeMetadata).toHaveBeenCalledWith({
        productUrl: "https://example.com/item",
      });
    });

    const nameInput = driver.nameInput() as HTMLInputElement;
    const codeInput = driver.codeInput() as HTMLInputElement;

    await waitFor(() => {
      expect(nameInput.value).toBe("Pobrana Nazwa Produktu");
      expect(codeInput.value).toBe("EAN-123456");
    });

    expect(driver.queryImageUrlInput()).not.toBeInTheDocument();
    expect(screen.getByText(/podgląd zdjęcia produktu/i)).toBeInTheDocument();
    expect(driver.deleteImageButton()).toBeInTheDocument();
  });

  it("does not overwrite already filled name and code on successful scrape", async () => {
    vi.mocked(productScrapeMetadata).mockResolvedValueOnce({
      data: {
        imageUrl: "https://example.com/scraped-image.jpg",
        name: "Nowa Nazwa",
        code: "NEW-CODE",
        shop: null,
        scrapedFields: ["name", "imageUrl", "code"],
      },
    });

    render(
      <FormWrapper
        defaultValues={{
          name: "Istniejąca Nazwa Wpisana Ręcznie",
          code: "MANUAL-01",
          productUrl: "https://example.com/item",
        }}
      />,
    );
    const driver = createProductFieldsDriver();

    await driver.user.click(driver.scrapeButton());

    const nameInput = driver.nameInput() as HTMLInputElement;
    const codeInput = driver.codeInput() as HTMLInputElement;

    await waitFor(() => {
      expect(screen.getByText(/podgląd zdjęcia produktu/i)).toBeInTheDocument();
    });

    expect(nameInput.value).toBe("Istniejąca Nazwa Wpisana Ręcznie");
    expect(codeInput.value).toBe("MANUAL-01");
  });

  it("allows removing the image via the 'Usuń' button in the preview", async () => {
    render(
      <FormWrapper
        defaultValues={{
          imageUrl: "https://example.com/initial-image.jpg",
        }}
      />,
    );
    const driver = createProductFieldsDriver();

    expect(driver.queryImageUrlInput()).not.toBeInTheDocument();
    expect(screen.getByText(/podgląd zdjęcia produktu/i)).toBeInTheDocument();

    await driver.user.click(driver.deleteImageButton());

    const imageUrlInput = driver.imageUrlInput() as HTMLInputElement;
    expect(imageUrlInput.value).toBe("");
    expect(screen.queryByText(/podgląd zdjęcia produktu/i)).not.toBeInTheDocument();
  });

  it("displays non-blocking error message when scraper fails", async () => {
    vi.mocked(productScrapeMetadata).mockResolvedValueOnce({
      serverError: "Nie udało się pobrać zdjęcia z podanej strony.",
    });

    render(
      <FormWrapper
        defaultValues={{
          productUrl: "https://example.com/unsupported-shop",
        }}
      />,
    );
    const driver = createProductFieldsDriver();

    await driver.user.click(driver.scrapeButton());

    await waitFor(() => {
      expect(
        screen.getByText(/nie udało się pobrać zdjęcia z podanej strony/i),
      ).toBeInTheDocument();
    });

    expect(driver.productUrlInput()).not.toBeInvalid();
  });

  it("auto-fills shop when scraper returns matched shop", async () => {
    vi.mocked(productScrapeMetadata).mockResolvedValueOnce({
      data: {
        imageUrl: "https://example.com/me-item.jpg",
        name: "Hulajnoga Kamikaze K1",
        code: "K1-PLUS",
        shop: {
          id: "shop-media-expert",
          name: "Media Expert",
          logo: "https://example.com/me-logo.svg",
        },
        scrapedFields: ["name", "imageUrl", "code", "shop"],
      },
    });

    render(
      <FormWrapper
        defaultValues={{
          productUrl: "https://www.mediaexpert.pl/rowery/hulajnogi/kamikaze-k1",
        }}
      />,
    );
    const driver = createProductFieldsDriver();

    await driver.user.click(driver.scrapeButton());

    await waitFor(() => {
      expect(screen.getByText(/media expert/i)).toBeInTheDocument();
      expect(screen.getByText(/wybrany sklep/i)).toBeInTheDocument();
    });
  });

  it("hides productUrl field when hideProductUrl is true", () => {
    render(<FormWrapper hideProductUrl={true} />);
    const driver = createProductFieldsDriver();

    expect(driver.nameInput()).toBeInTheDocument();
    expect(driver.queryProductUrlInput()).not.toBeInTheDocument();
  });

  it("marks filled fields as 'Uzupełnione' and empty fields as 'Do uzupełnienia' when showFieldStatus is true", () => {
    render(
      <FormWrapper
        showFieldStatus={true}
        defaultValues={{
          name: "Myszka bezprzewodowa",
          code: "",
        }}
      />,
    );
    const driver = createProductFieldsDriver();

    expect(driver.statusBadges(/uzupełnione/i).length).toBeGreaterThanOrEqual(1);
    expect(driver.statusBadges(/do uzupełnienia/i).length).toBeGreaterThanOrEqual(2);
  });

  it("reactively updates field status when user fills missing data and clears existing data", async () => {
    render(
      <FormWrapper
        showFieldStatus={true}
        defaultValues={{
          name: "Testowy Produkt",
          code: "",
        }}
      />,
    );
    const driver = createProductFieldsDriver();

    expect(driver.statusBadges(/do uzupełnienia/i).length).toBe(3);
    expect(driver.statusBadges(/uzupełnione/i).length).toBe(1);

    await driver.user.type(driver.codeInput(), "12345678");

    await waitFor(() => {
      expect(driver.statusBadges(/uzupełnione/i).length).toBe(2);
      expect(driver.statusBadges(/do uzupełnienia/i).length).toBe(2);
    });

    await driver.user.clear(driver.nameInput());

    await waitFor(() => {
      expect(driver.statusBadges(/uzupełnione/i).length).toBe(1);
      expect(driver.statusBadges(/do uzupełnienia/i).length).toBe(3);
    });
  });

  it("activates field status marking after in-form scrape completes", async () => {
    vi.mocked(productScrapeMetadata).mockResolvedValueOnce({
      data: {
        imageUrl: "https://example.com/item.jpg",
        name: "Produkt ze scrapera",
        code: "",
        shop: null,
        scrapedFields: ["name", "imageUrl"],
      },
    });

    render(<FormWrapper />);
    const driver = createProductFieldsDriver();

    expect(screen.queryByText(/uzupełnione/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/do uzupełnienia/i)).not.toBeInTheDocument();

    await driver.user.type(driver.productUrlInput(), "https://example.com/item");
    await driver.user.click(driver.scrapeButton());

    const nameInput = driver.nameInput() as HTMLInputElement;
    await waitFor(() => {
      expect(nameInput.value).toBe("Produkt ze scrapera");
      expect(driver.statusBadges(/uzupełnione/i).length).toBe(2);
      expect(driver.statusBadges(/do uzupełnienia/i).length).toBe(2);
    });
  });
});
