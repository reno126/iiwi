import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShopCard } from "@/components/shops/ShopCard";
import type { ShopItem } from "@/serverActions/shopsGet";

const mockShop: ShopItem = {
  id: "shop-1",
  name: "Super Sklep",
  logo: "/shops/super.png",
};

describe("components/shops/ShopCard", () => {
  it("renders shop card with name and logo", () => {
    render(<ShopCard shop={mockShop} />);

    expect(screen.getByText("Super Sklep")).toBeInTheDocument();
    expect(screen.getByAltText("Super Sklep")).toBeInTheDocument();
  });
});
