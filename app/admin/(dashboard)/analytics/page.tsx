import { db } from "@/lib/db";
import { pageViews, orders } from "@/lib/db/schema";
import { desc, sql, gte, count, countDistinct } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getAnalytics() {
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalViews30d,
    uniqueVisitors30d,
    uniqueVisitors7d,
    topPages,
    topReferrers,
    topCities,
    deviceBreakdown,
    dailyVisitors,
    ordersLast30d,
  ] = await Promise.all([
    // Total page views last 30 days
    db.select({ c: count() }).from(pageViews).where(gte(pageViews.createdAt, since30d)),

    // Unique visitors (fingerprints) last 30 days
    db.select({ c: countDistinct(pageViews.fingerprint) }).from(pageViews).where(gte(pageViews.createdAt, since30d)),

    // Unique visitors last 7 days
    db.select({ c: countDistinct(pageViews.fingerprint) }).from(pageViews).where(gte(pageViews.createdAt, since7d)),

    // Top pages (last 30d)
    db
      .select({ page: pageViews.page, views: count() })
      .from(pageViews)
      .where(gte(pageViews.createdAt, since30d))
      .groupBy(pageViews.page)
      .orderBy(desc(count()))
      .limit(10),

    // Top referrers (last 30d)
    db
      .select({ referrer: pageViews.referrer, visits: count() })
      .from(pageViews)
      .where(gte(pageViews.createdAt, since30d))
      .groupBy(pageViews.referrer)
      .orderBy(desc(count()))
      .limit(8),

    // Top cities
    db
      .select({ city: pageViews.city, visits: count() })
      .from(pageViews)
      .where(gte(pageViews.createdAt, since30d))
      .groupBy(pageViews.city)
      .orderBy(desc(count()))
      .limit(8),

    // Device breakdown
    db
      .select({ deviceType: pageViews.deviceType, visits: count() })
      .from(pageViews)
      .where(gte(pageViews.createdAt, since30d))
      .groupBy(pageViews.deviceType)
      .orderBy(desc(count())),

    // Daily visitors (last 14 days)
    db
      .select({
        day: sql<string>`date_trunc('day', ${pageViews.createdAt})::date::text`,
        visitors: countDistinct(pageViews.fingerprint),
      })
      .from(pageViews)
      .where(gte(pageViews.createdAt, new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)))
      .groupBy(sql`date_trunc('day', ${pageViews.createdAt})`)
      .orderBy(sql`date_trunc('day', ${pageViews.createdAt})`),

    // Orders last 30 days
    db.select({ c: count() }).from(orders).where(gte(orders.createdAt, since30d)),
  ]);

  return {
    totalViews30d: Number(totalViews30d[0]?.c ?? 0),
    uniqueVisitors30d: Number(uniqueVisitors30d[0]?.c ?? 0),
    uniqueVisitors7d: Number(uniqueVisitors7d[0]?.c ?? 0),
    ordersLast30d: Number(ordersLast30d[0]?.c ?? 0),
    topPages,
    topReferrers: topReferrers.filter((r) => r.referrer),
    topCities: topCities.filter((c) => c.city),
    deviceBreakdown,
    dailyVisitors,
  };
}

export default async function AdminAnalyticsPage() {
  const data = await getAnalytics();

  const conversionRate =
    data.uniqueVisitors30d > 0
      ? ((data.ordersLast30d / data.uniqueVisitors30d) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Last 30 days · no third-party tracking
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Unique visitors (30d)", value: data.uniqueVisitors30d.toLocaleString("en-IN") },
          { label: "Unique visitors (7d)", value: data.uniqueVisitors7d.toLocaleString("en-IN") },
          { label: "Page views (30d)", value: data.totalViews30d.toLocaleString("en-IN") },
          { label: "Orders (30d) · conv. " + conversionRate + "%", value: data.ordersLast30d.toLocaleString("en-IN") },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted)]">{card.label}</p>
            <p className="mt-2 font-serif text-[40px] leading-none text-[var(--color-ink)]">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Daily visitors sparkline */}
      {data.dailyVisitors.length > 0 && (
        <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
          <h2 className="mb-4 font-serif text-xl text-[var(--color-ink)]">Daily visitors (14 days)</h2>
          <div className="flex items-end gap-1" style={{ height: "80px" }}>
            {data.dailyVisitors.map((d) => {
              const max = Math.max(...data.dailyVisitors.map((x) => Number(x.visitors)));
              const pct = max > 0 ? (Number(d.visitors) / max) * 100 : 0;
              return (
                <div key={d.day} className="group relative flex-1">
                  <div
                    className="w-full rounded-t-sm bg-[var(--color-accent)] transition-all group-hover:opacity-80"
                    style={{ height: `${Math.max(4, pct)}%` }}
                  />
                  <div className="absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded bg-[var(--color-ink)] px-1 py-0.5 text-[9px] text-white group-hover:block whitespace-nowrap">
                    {d.visitors}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-[var(--color-muted)]">
            <span>{data.dailyVisitors[0]?.day?.slice(5)}</span>
            <span>{data.dailyVisitors[data.dailyVisitors.length - 1]?.day?.slice(5)}</span>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top pages */}
        <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
          <h2 className="mb-4 font-serif text-xl text-[var(--color-ink)]">Top pages</h2>
          <ul className="space-y-2">
            {data.topPages.map((p) => {
              const max = Number(data.topPages[0]?.views ?? 1);
              const pct = (Number(p.views) / max) * 100;
              return (
                <li key={p.page} className="text-sm">
                  <div className="flex justify-between text-[var(--color-ink)]">
                    <span className="truncate max-w-[220px] font-mono text-xs">{p.page}</span>
                    <span className="text-[var(--color-muted)]">{Number(p.views).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-[var(--color-line)]">
                    <div className="h-1 rounded-full bg-[var(--color-accent)]" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Top referrers */}
        <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
          <h2 className="mb-4 font-serif text-xl text-[var(--color-ink)]">Referrers</h2>
          {data.topReferrers.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">No referrer data yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.topReferrers.map((r) => {
                const max = Number(data.topReferrers[0]?.visits ?? 1);
                const pct = (Number(r.visits) / max) * 100;
                return (
                  <li key={r.referrer} className="text-sm">
                    <div className="flex justify-between text-[var(--color-ink)]">
                      <span className="truncate max-w-[220px] text-xs text-[var(--color-muted)]">
                        {new URL(r.referrer!).hostname}
                      </span>
                      <span className="text-[var(--color-muted)]">{Number(r.visits).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="mt-1 h-1 rounded-full bg-[var(--color-line)]">
                      <div className="h-1 rounded-full bg-blue-400" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Cities */}
        <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
          <h2 className="mb-4 font-serif text-xl text-[var(--color-ink)]">Top cities</h2>
          {data.topCities.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">City data shows once deployed to Vercel.</p>
          ) : (
            <ul className="space-y-2">
              {data.topCities.map((c) => (
                <li key={c.city} className="flex justify-between text-sm">
                  <span className="text-[var(--color-ink)]">{c.city}</span>
                  <span className="text-[var(--color-muted)]">{Number(c.visits).toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Device breakdown */}
        <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
          <h2 className="mb-4 font-serif text-xl text-[var(--color-ink)]">Devices</h2>
          {data.deviceBreakdown.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">No device data yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.deviceBreakdown.map((d) => {
                const total = data.deviceBreakdown.reduce((s, x) => s + Number(x.visits), 0);
                const pct = total > 0 ? ((Number(d.visits) / total) * 100).toFixed(0) : 0;
                return (
                  <li key={d.deviceType}>
                    <div className="flex justify-between text-sm text-[var(--color-ink)]">
                      <span className="capitalize">{d.deviceType ?? "unknown"}</span>
                      <span className="text-[var(--color-muted)]">{pct}%</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-[var(--color-line)]">
                      <div className="h-2 rounded-full bg-[var(--color-accent)]" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
