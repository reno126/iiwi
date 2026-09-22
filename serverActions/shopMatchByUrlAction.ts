"use server";

import { shopMatchSchema } from "@/schemas/shop";
import { findShopByUrl } from "@/lib/shops/findShopByUrl";
import { publicActionClient } from "@/lib/actions/safeActionClient";

export const shopMatchByUrlAction = publicActionClient
  .inputSchema(shopMatchSchema)
  .action(async ({ parsedInput }) => {
    return await findShopByUrl(parsedInput.url);
  });
