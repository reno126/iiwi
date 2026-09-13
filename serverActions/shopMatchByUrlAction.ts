"use server";

import { shopMatchSchema } from "@/schemas/shop";
import { findShopByUrl } from "@/lib/shops/findShopByUrl";
import { createSafeActionClient } from "next-safe-action";

export const shopMatchByUrlAction = createSafeActionClient()
  .inputSchema(shopMatchSchema)
  .action(async ({ parsedInput }) => {
    return await findShopByUrl(parsedInput.url);
  });
