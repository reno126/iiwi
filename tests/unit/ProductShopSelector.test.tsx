import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider } from "react-hook-form";
import {
  ProductShopSelector,
  SHOP_SELECTOR_MESSAGES,
} from "@/app/opinie/dodaj/_components/ProductShopSelector";
import { shopsGet } from "@/serverActions/shopsGet";
import type { ProductCreateInput } from "@/schemas/product";
import type { MatchedShopResult } from "@/lib/shops/findShopByUrl";

vi.mock("@/serverActions/shopsGet", () => ({
  shopsGet: vi.fn(),
}));

interface WrapperProps {
  selectedShop: MatchedShopResult | null;
  onSelectShop: (shop: MatchedShopResult | null) => void;
  defaultShopId?: string;
}

function SelectorWrapper({
  selectedShop,
  onSelectShop,
  defaultShopId = "",
}: WrapperProps) {
  const methods = useForm<ProductCreateInput>({
    defaultValues: {
      name: "",
      productUrl: "",
      imageUrl: "",
      code: "",
      shopId: defaultShopId,
    },
  });

  return (
    <FormProvider {...methods}>
      <ProductShopSelector
        selectedShop={selectedShop}
        onSelectShop={onSelectShop}
      />
    </FormProvider>
  );
}

describe("app/opinie/dodaj/_components/ProductShopSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state with placeholder and 'Wybierz z listy' trigger when selectedShop is null", () => {
    const onSelectShop = vi.fn();
    render(<SelectorWrapper selectedShop={null} onSelectShop={onSelectShop} />);

    expect(
      screen.getByText(SHOP_SELECTOR_MESSAGES.helperText)
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText(SHOP_SELECTOR_MESSAGES.selectFromList)).toBeInTheDocument();
  });

  it("renders shop card with logo and name when selectedShop is provided", () => {
    const onSelectShop = vi.fn();
    render(
      <SelectorWrapper
        selectedShop={{
          id: "shop-me",
          name: "Media Expert",
          logo: "https://example.com/me.png",
        }}
        onSelectShop={onSelectShop}
        defaultShopId="shop-me"
      />
    );

    expect(screen.getByText("Media Expert")).toBeInTheDocument();
    expect(screen.getByText(SHOP_SELECTOR_MESSAGES.selectedShop)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Media Expert" })).toHaveAttribute(
      "src",
      "https://example.com/me.png"
    );
    expect(
      screen.getByRole("button", { name: SHOP_SELECTOR_MESSAGES.deleteShopAriaLabel })
    ).toBeInTheDocument();
    expect(screen.getByText(SHOP_SELECTOR_MESSAGES.change)).toBeInTheDocument();
  });

  it("clears shop when delete button is clicked", async () => {
    const user = userEvent.setup();
    const onSelectShop = vi.fn();

    render(
      <SelectorWrapper
        selectedShop={{
          id: "shop-me",
          name: "Media Expert",
          logo: "https://example.com/me.png",
        }}
        onSelectShop={onSelectShop}
        defaultShopId="shop-me"
      />
    );

    const deleteBtn = screen.getByRole("button", { name: SHOP_SELECTOR_MESSAGES.deleteShopAriaLabel });
    await user.click(deleteBtn);

    expect(onSelectShop).toHaveBeenCalledWith(null);
  });

  it("lazily fetches shops list when picker trigger is clicked", async () => {
    const user = userEvent.setup();
    const onSelectShop = vi.fn();

    vi.mocked(shopsGet).mockResolvedValueOnce([
      { id: "shop-1", name: "Biedronka", logo: null, matcherKeys: ["biedronka.pl"] },
      { id: "shop-2", name: "Lidl", logo: null, matcherKeys: ["lidl.pl"] },
    ]);

    render(<SelectorWrapper selectedShop={null} onSelectShop={onSelectShop} />);

    expect(shopsGet).not.toHaveBeenCalled();

    const triggerBtn = screen.getByRole("combobox");
    await user.click(triggerBtn);

    await waitFor(() => {
      expect(shopsGet).toHaveBeenCalledTimes(1);
    });
  });
});
