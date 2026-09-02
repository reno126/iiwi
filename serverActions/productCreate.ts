"use server";

import { safeActionUserCtx } from "@/lib/actions/safeActionUserCtx";
import { prisma } from "@/lib/db/prisma";
import { productCreateSchema } from "@/schemas/product";

export const productCreate = safeActionUserCtx
  .inputSchema(productCreateSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { name, productUrl, imageUrl, code } = parsedInput;
    const { userId } = ctx;

    const product = await prisma.product.create({
      data: {
        name,
        productUrl: productUrl ? productUrl : null,
        imageUrl: imageUrl ? imageUrl : null,
        code: code ? code : null,
        creatorId: userId,
      },
    });

    return product;
  });
