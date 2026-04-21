import { NextResponse } from "next/server";
import { getAllProducts } from "@/features/products/services/product-service";
import type { ProductCategory } from "@/features/products/types";
import { CATEGORY_LABEL } from "@/features/products/types";

export const revalidate = 60;

function isCategory(value: string | null): value is ProductCategory {
  return value !== null && value in CATEGORY_LABEL;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const products = await getAllProducts();
  const filtered = isCategory(category)
    ? products.filter((p) => p.category === category)
    : products;

  return NextResponse.json({ products: filtered });
}
