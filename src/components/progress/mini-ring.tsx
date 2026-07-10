export function MiniRing({ percent, color, size = 44 }: { percent: number; color: string; size?: number }) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(percent, 0), 100);

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} className="fill-none stroke-black/[0.06] dark:stroke-white/[0.08]" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        strokeLinecap="round"
        stroke={color}
        className="fill-none"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - clamped / 100)}
      />
    </svg>
  );
}
