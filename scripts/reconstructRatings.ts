import process from "node:process";
import { prisma } from "@/lib/db/prisma";
import { reconstructRatings } from "@/serverActions/reconstructRatings";

interface CliOptions {
  help: boolean;
  productId?: string;
}

function parseCliArgs(args: string[]): CliOptions {
  let productId: string | undefined;
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      help = true;
    } else if (arg === "-p" || arg === "--productId" || arg === "--id") {
      productId = args[i + 1];
      i++;
    } else if (arg.startsWith("--productId=")) {
      productId = arg.slice("--productId=".length);
    } else if (arg.startsWith("--id=")) {
      productId = arg.slice("--id=".length);
    } else if (!arg.startsWith("-") && !productId) {
      productId = arg;
    }
  }

  return {
    help,
    productId: productId?.trim() ? productId.trim() : undefined,
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseCliArgs(args);

  if (options.help) {
    console.log(`
Usage:
  npm run ratings:reconstruct [productId] [options]

Arguments:
  productId               Optional product ID to reconstruct ratings for a single product

Options:
  -p, --productId <id>    Specify product ID
  --id <id>               Alias for --productId
  -h, --help              Show this help message

Examples:
  npm run ratings:reconstruct
  npm run ratings:reconstruct -- <productId>
  npm run ratings:reconstruct -- --productId=<productId>
`);
    return;
  }

  console.log(
    options.productId
      ? `Starting ratings reconstruction for product ID: "${options.productId}"...`
      : "Starting ratings reconstruction for ALL products...",
  );

  try {
    const result = await reconstructRatings(
      options.productId ? { productId: options.productId } : undefined,
    );

    if (!result.success) {
      console.error(
        `[ERROR] Reconstruction failed: ${result.error ?? "Unknown error"}`,
      );
      process.exitCode = 1;
      return;
    }

    if (result.products.length === 0) {
      console.log("No products found to update.");
    } else {
      console.log(
        `\nSuccessfully updated ${result.updatedCount} product(s):\n`,
      );
      for (const prod of result.products) {
        console.log(
          ` - [${prod.id}] "${prod.name}": rate_avg = ${
            prod.rate_avg !== null ? prod.rate_avg : "null"
          } (${prod.reviewCount} review${prod.reviewCount === 1 ? "" : "s"})`,
        );
      }
      console.log("\nReconstruction finished successfully.");
    }
  } catch (error) {
    console.error("[ERROR] Unexpected error during reconstruction:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("[FATAL] Unhandled CLI error:", err);
  process.exit(1);
});
