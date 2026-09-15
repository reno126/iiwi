import { shopsGet } from "@/serverActions/shopsGet";
import { ShopsGrid } from "./ShopsGrid";

export async function ShopsSection() {
  const shops = await shopsGet();
  return <ShopsGrid shops={shops} />;
}
