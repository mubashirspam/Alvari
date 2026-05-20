import { ImageResponse } from "next/og";
import { getProductBySlug } from "@/features/products/services/product-service";
import { CATEGORY_LABEL } from "@/features/products/types";
import { siteConfig } from "@/lib/env";

export const runtime = "nodejs";
export const revalidate = 3600;

type Params = Promise<{ slug: string }>;

function formatINR(rupees: number): string {
  return `₹${rupees.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export async function GET(_req: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  const title = product?.name ?? "Alvari";
  const category = product ? CATEGORY_LABEL[product.category] : "Furniture";
  const price = product ? formatINR(product.priceNow) : "";
  const tagline = product?.meta ?? "Direct-from-Factory Furniture · Wayanad";
  const gradFrom = product?.gradientFrom ?? "#5e3b18";
  const gradTo = product?.gradientTo ?? "#8a5a2b";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: `linear-gradient(135deg, ${gradFrom} 0%, ${gradTo} 100%)`,
          color: "#fdf6e8",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: "0.02em" }}>
            {siteConfig.name}
          </div>
          <div
            style={{
              fontSize: 18,
              padding: "8px 20px",
              border: "1px solid rgba(253,246,232,0.4)",
              borderRadius: 999,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
            }}
          >
            {category}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 88,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 28, opacity: 0.85, maxWidth: 900 }}>{tagline}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          {price ? (
            <div style={{ fontSize: 48, fontWeight: 600 }}>{price}</div>
          ) : (
            <div />
          )}
          <div style={{ fontSize: 22, opacity: 0.8 }}>
            Wayanad · Delivered across Kerala
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
