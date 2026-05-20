import { ImageResponse } from "next/og";
import { getPublishedPostBySlug } from "@/features/blog/services/blog-service";
import { siteConfig } from "@/lib/env";

export const runtime = "nodejs";
export const revalidate = 3600;

type Params = Promise<{ slug: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  const title = post?.title ?? "Alvari Journal";
  const excerpt =
    post?.excerpt ?? "Notes from our Wayanad workshop — design, materials, and life with handmade furniture.";
  const author = post?.authorName ?? siteConfig.name;
  const minutes = post?.readingMinutes ?? 4;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(160deg, #f7f3ec 0%, #ecd9b8 100%)",
          color: "#2b1d0c",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: "0.02em" }}>
            {siteConfig.name}
          </div>
          <div style={{ fontSize: 20, opacity: 0.6 }}>· Journal</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 76,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 26, lineHeight: 1.4, maxWidth: 980, opacity: 0.7 }}>
            {excerpt}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 22, opacity: 0.7 }}>{author}</div>
          <div style={{ fontSize: 22, opacity: 0.7 }}>{minutes} min read</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
