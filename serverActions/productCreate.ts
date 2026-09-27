"use server";

import { revalidatePath, updateTag } from "next/cache";
import { safeActionUserCtx } from "@/lib/actions/safeActionUserCtx";
import { prisma } from "@/lib/db/prisma";
import {
  productCreateSchema,
  productCreatedOutputSchema,
  type ProductCreatedOutput,
} from "@/schemas/product";

export const productCreate = safeActionUserCtx
  .inputSchema(productCreateSchema)
  .outputSchema(productCreatedOutputSchema)
  .action(async ({ parsedInput, ctx }): Promise<ProductCreatedOutput> => {
    const { name, productUrl, imageUrl, code, shopId } = parsedInput;
    const { userId } = ctx;

    const createdProduct = await prisma.product.create({
      data: {
        name,
        productUrl: productUrl ? productUrl : null,
        imageUrl: imageUrl ? imageUrl : null,
        code: code ? code : null,
        shopId: shopId ? shopId : null,
        creatorId: userId,
        rate_avg: 0,
        rate_count: 0,
      },
    });

    try {
      updateTag("products-count");
      revalidatePath("/produkty");
    } catch {
      return {
        id: createdProduct.id,
        name: createdProduct.name,
        productUrl: createdProduct.productUrl,
        imageUrl: createdProduct.imageUrl,
        code: createdProduct.code,
        shopId: createdProduct.shopId,
        rate_avg: createdProduct.rate_avg,
        rate_count: createdProduct.rate_count,
      };
    }

    return {
      id: createdProduct.id,
      name: createdProduct.name,
      productUrl: createdProduct.productUrl,
      imageUrl: createdProduct.imageUrl,
      code: createdProduct.code,
      shopId: createdProduct.shopId,
      rate_avg: createdProduct.rate_avg,
      rate_count: createdProduct.rate_count,
    };
  });
