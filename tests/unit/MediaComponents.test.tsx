import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductThumbnail } from "@/components/products/ProductThumbnail";
import { ShopLogo } from "@/components/shops/ShopLogo";

describe("components/products/ProductThumbnail", () => {
  it("renders img tag when src is provided with correct attributes", () => {
    render(
      <ProductThumbnail
        src="https://example.com/product.jpg"
        alt="Słuchawki bezprzewodowe"
        size="md"
      />,
    );

    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/product.jpg");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("sets eager loading and high fetchPriority when priority is true", () => {
    render(
      <ProductThumbnail
        src="https://example.com/priority.jpg"
        alt="Produkt priorytetowy"
        priority
      />,
    );

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("loading", "eager");
    expect(img).toHaveAttribute("fetchpriority", "high");
  });

  it("renders fallback package icon when src is missing or null", () => {
    const { container } = render(
      <ProductThumbnail alt="Produkt bez zdjęcia" />,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    const svgIcon = container.querySelector("svg");
    expect(svgIcon).toBeInTheDocument();
    expect(svgIcon).toHaveAttribute("aria-hidden", "true");
  });

  it("applies sizing classes correctly", () => {
    const { container: xsContainer } = render(
      <ProductThumbnail
        src="https://example.com/item.jpg"
        alt="Item"
        size="xs"
      />,
    );
    expect(xsContainer.firstChild).toHaveClass("size-8");

    const { container: lgContainer } = render(
      <ProductThumbnail
        src="https://example.com/item.jpg"
        alt="Item"
        size="lg"
      />,
    );
    expect(lgContainer.firstChild).toHaveClass("size-24");
  });

  it("applies aspect ratio classes correctly", () => {
    const { container: squareContainer } = render(
      <ProductThumbnail
        src="https://example.com/item.jpg"
        alt="Item"
        aspectRatio="square"
      />,
    );
    expect(squareContainer.firstChild).toHaveClass("aspect-square");

    const { container: videoContainer } = render(
      <ProductThumbnail
        src="https://example.com/item.jpg"
        alt="Item"
        aspectRatio="video"
      />,
    );
    expect(videoContainer.firstChild).toHaveClass("aspect-video");
  });
});

describe("components/shops/ShopLogo", () => {
  it("renders img tag when logo URL is provided", () => {
    render(
      <ShopLogo logo="https://example.com/shop.png" name="Media Expert" />,
    );

    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/shop.png");
  });

  it("uses fallback name 'Sklep' when name is missing but logo is provided", () => {
    render(<ShopLogo logo="https://example.com/shop.png" />);

    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
  });

  it("renders fallback Store icon when logo is null or undefined", () => {
    const { container } = render(<ShopLogo name="Brak Logo" />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("applies container and icon sizes for sm, md, and lg sizes", () => {
    const { container: smContainer } = render(<ShopLogo size="sm" />);
    expect(smContainer.firstChild).toHaveClass("size-6");

    const { container: mdContainer } = render(<ShopLogo size="md" />);
    expect(mdContainer.firstChild).toHaveClass("size-9");

    const { container: lgContainer } = render(<ShopLogo size="lg" />);
    expect(lgContainer.firstChild).toHaveClass("size-16");
  });
});
