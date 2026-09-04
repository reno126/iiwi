"use client";

import { useFormContext } from "react-hook-form";
import {
  FieldSet,
  FieldLegend,
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ProductCreateInput } from "@/schemas/product";

interface ProductFieldsProps {
  className?: string;
  legend?: string;
}

export function ProductFields({
  className,
  legend = "Informacje o produkcie",
}: ProductFieldsProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ProductCreateInput>();

  return (
    <FieldSet className={className}>
      <FieldLegend>{legend}</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="product-name">Nazwa produktu *</FieldLabel>
          <Input
            id="product-name"
            placeholder="np. Logitech MX Master 3S"
            {...register("name")}
          />
          {errors.name?.message && (
            <FieldError>{errors.name.message}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="product-url">Adres URL do produktu</FieldLabel>
          <Input
            id="product-url"
            type="url"
            placeholder="https://example.com/produkt"
            {...register("productUrl")}
          />
          {errors.productUrl?.message && (
            <FieldError>{errors.productUrl.message}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="product-image">Adres URL zdjęcia</FieldLabel>
          <Input
            id="product-image"
            type="url"
            placeholder="https://example.com/zdjecie.jpg"
            {...register("imageUrl")}
          />
          {errors.imageUrl?.message && (
            <FieldError>{errors.imageUrl.message}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="product-code">Kod produktu / EAN</FieldLabel>
          <Input
            id="product-code"
            placeholder="np. 5099206103734"
            {...register("code")}
          />
          {errors.code?.message && (
            <FieldError>{errors.code.message}</FieldError>
          )}
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
