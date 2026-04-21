export function AnnouncementBar() {
  return (
    <div
      className="bg-[var(--color-ink)] py-2.5 text-center text-xs font-light tracking-[0.1em] text-[var(--color-bg)]"
      style={{ animation: "slide-down 0.8s var(--ease-alvari) both" }}
    >
      <b className="font-medium text-[var(--color-accent-warm)]">Launch Offer</b> ·
      Free measurement service across Kerala · Factory prices, no middlemen
    </div>
  );
}
