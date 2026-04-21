import type { ReactNode } from "react";

const stroke = "#F5EFE6";

const illustrations: Record<string, ReactNode> = {
  almirah: (
    <svg
      viewBox="0 0 200 220"
      fill="none"
      stroke={stroke}
      strokeWidth={1.5}
      opacity={0.85}
    >
      <rect x="30" y="20" width="140" height="180" rx="3" />
      <line x1="100" y1="20" x2="100" y2="200" />
      <circle cx="92" cy="110" r="3" fill={stroke} />
      <circle cx="108" cy="110" r="3" fill={stroke} />
      <line x1="40" y1="40" x2="90" y2="40" />
      <line x1="110" y1="40" x2="160" y2="40" />
      <line x1="40" y1="170" x2="90" y2="170" />
      <line x1="110" y1="170" x2="160" y2="170" />
    </svg>
  ),
  bed: (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      stroke={stroke}
      strokeWidth={1.5}
      opacity={0.85}
    >
      <rect x="20" y="50" width="200" height="100" rx="5" />
      <rect x="20" y="30" width="200" height="40" rx="5" />
      <line x1="20" y1="110" x2="220" y2="110" />
      <rect x="36" y="72" width="36" height="22" rx="2" />
      <rect x="168" y="72" width="36" height="22" rx="2" />
      <line x1="30" y1="150" x2="30" y2="165" />
      <line x1="210" y1="150" x2="210" y2="165" />
    </svg>
  ),
  sofa: (
    <svg
      viewBox="0 0 240 160"
      fill="none"
      stroke={stroke}
      strokeWidth={1.5}
      opacity={0.85}
    >
      <rect x="20" y="60" width="200" height="50" rx="8" />
      <rect x="20" y="40" width="45" height="35" rx="5" />
      <rect x="175" y="40" width="45" height="35" rx="5" />
      <rect x="70" y="40" width="100" height="35" rx="4" />
      <line x1="116" y1="42" x2="116" y2="75" />
      <line x1="30" y1="110" x2="30" y2="125" />
      <line x1="210" y1="110" x2="210" y2="125" />
    </svg>
  ),
  dining: (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      stroke={stroke}
      strokeWidth={1.5}
      opacity={0.85}
    >
      <ellipse cx="120" cy="80" rx="90" ry="20" />
      <line x1="50" y1="90" x2="50" y2="155" />
      <line x1="190" y1="90" x2="190" y2="155" />
      <line x1="120" y1="100" x2="120" y2="155" />
      <rect x="16" y="110" width="20" height="40" rx="3" />
      <rect x="204" y="110" width="20" height="40" rx="3" />
      <rect x="90" y="110" width="20" height="40" rx="3" />
      <rect x="130" y="110" width="20" height="40" rx="3" />
    </svg>
  ),
  dressing: (
    <svg
      viewBox="0 0 200 240"
      fill="none"
      stroke={stroke}
      strokeWidth={1.5}
      opacity={0.85}
    >
      <ellipse cx="100" cy="70" rx="56" ry="64" />
      <rect x="30" y="130" width="140" height="70" rx="3" />
      <line x1="100" y1="130" x2="100" y2="200" />
      <line x1="30" y1="160" x2="170" y2="160" />
      <circle cx="70" cy="180" r="2.5" fill={stroke} />
      <circle cx="130" cy="180" r="2.5" fill={stroke} />
      <line x1="40" y1="200" x2="40" y2="224" />
      <line x1="160" y1="200" x2="160" y2="224" />
    </svg>
  ),
  room_set: (
    <svg
      viewBox="0 0 240 200"
      fill="none"
      stroke={stroke}
      strokeWidth={1.5}
      opacity={0.85}
    >
      <rect x="20" y="90" width="110" height="60" rx="3" />
      <rect x="20" y="70" width="110" height="25" rx="2" />
      <rect x="150" y="30" width="60" height="120" rx="2" />
      <line x1="180" y1="30" x2="180" y2="150" />
      <rect x="80" y="160" width="140" height="8" rx="2" />
    </svg>
  ),
};

export function ProductIllustration({
  illustrationKey,
}: {
  illustrationKey: string;
}) {
  return illustrations[illustrationKey] ?? illustrations.almirah;
}
