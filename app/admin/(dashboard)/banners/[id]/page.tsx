import { notFound } from "next/navigation";
import { BreadcrumbLabel } from "@/features/admin/components/admin-breadcrumbs";
import { BannerForm } from "@/features/admin/components/banner-form";
import { getBannerById } from "@/features/banners/services/banner-service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit banner · Alvari admin" };

type Params = Promise<{ id: string }>;

export default async function EditBannerPage({ params }: { params: Params }) {
  const { id } = await params;
  const banner = await getBannerById(id);
  if (!banner) notFound();

  return (
    <div className="space-y-8">
      <BreadcrumbLabel segment={id} label={banner.slug} />
      <div>
        <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
          Edit banner
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          /{banner.slug}
        </p>
      </div>
      <BannerForm banner={banner} />
    </div>
  );
}
