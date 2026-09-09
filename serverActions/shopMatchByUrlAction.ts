"use server";

import { safeActionUserCtx } from "@/lib/actions/safeActionUserCtx";
import { shopMatchSchema } from "@/schemas/shop";
import { findShopByUrl } from "@/lib/shops/findShopByUrl";

export const shopMatchByUrlAction = safeActionUserCtx
  .inputSchema(shopMatchSchema)
  .action(async ({ parsedInput }) => {
    return await findShopByUrl(parsedInput.url);
  });
