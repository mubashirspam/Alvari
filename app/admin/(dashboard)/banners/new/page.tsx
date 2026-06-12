import { BannerForm } from "@/features/admin/components/banner-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "New banner · Alvari admin" };

export default function NewBannerPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
          New banner
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Create a banner for the homepage hero, promo strip, or mid-page slot. Use the schedule fields to auto-publish/expire.
        </p>
      </div>
      <BannerForm />
    </div>
  );
}
