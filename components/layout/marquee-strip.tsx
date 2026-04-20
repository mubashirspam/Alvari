const items = [
  "Direct from factory",
  "No middlemen",
  "Custom measurements",
  "Delivered across Kerala",
  "Solid Sheesham & Teak",
  "Pay on delivery",
];

export function MarqueeStrip() {
  const loop = [...items, ...items];

  return (
    <div className="overflow-hidden bg-[var(--color-ink)] py-5">
      <div
        className="flex gap-20 whitespace-nowrap will-change-transform"
        style={{ animation: "marquee 25s linear infinite" }}
      >
        {loop.map((text, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-6 font-serif text-[22px] italic text-[var(--color-bg)] opacity-70"
          >
            {text}
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-warm)]" />
          </span>
        ))}
      </div>
    </div>
  );
}
