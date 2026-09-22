import type {
  UseFormSetValue,
  UseFormGetValues,
  FieldValues,
  Path,
  PathValue,
} from "react-hook-form";
import type { ScrapedMetadataResult } from "@/schemas/productScrape";

interface PopulateScrapedFieldsOptions<T extends FieldValues> {
  data: ScrapedMetadataResult;
  setValue: UseFormSetValue<T>;
  getValues?: UseFormGetValues<T>;
  overwrite?: boolean;
}

export function populateScrapedFields<T extends FieldValues>({
  data,
  setValue,
  getValues,
  overwrite = false,
}: PopulateScrapedFieldsOptions<T>) {
  if (data.imageUrl) {
    setValue("imageUrl" as Path<T>, data.imageUrl as PathValue<T, Path<T>>, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  const currentName = getValues
    ? String(getValues("name" as Path<T>) || "").trim()
    : "";
  if (data.name && (overwrite || !currentName)) {
    setValue("name" as Path<T>, data.name as PathValue<T, Path<T>>, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  const currentCode = getValues
    ? String(getValues("code" as Path<T>) || "").trim()
    : "";
  if (data.code && (overwrite || !currentCode)) {
    setValue("code" as Path<T>, data.code as PathValue<T, Path<T>>, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  if (data.shop) {
    setValue("shopId" as Path<T>, data.shop.id as PathValue<T, Path<T>>, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }
}
