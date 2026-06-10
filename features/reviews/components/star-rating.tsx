import { Star } from "lucide-react";

/** Read-only star row, supports halves via fractional `value` (e.g. 4.3). */
export function StarRating({
  value,
  size = 16,
  className = "",
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      role="img"
      aria-label={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.min(Math.max(value - (star - 1), 0), 1);
        return (
          <span key={star} className="relative inline-block" style={{ width: size, height: size }}>
            <Star
              className="absolute inset-0 text-[var(--color-line)]"
              style={{ width: size, height: size }}
              strokeWidth={1.5}
            />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star
                className="fill-[#E8A838] text-[#E8A838]"
                style={{ width: size, height: size }}
                strokeWidth={1.5}
              />
            </span>
          </span>
        );
      })}
    </div>
  );
}
