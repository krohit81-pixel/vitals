const COLORS = { fat: "#F59E0B", carbs: "#3B82F6", protein: "#10B981" };

export function MiniMacroDonut({
  fatG,
  carbsG,
  proteinG,
  size = 44,
}: {
  fatG: number;
  carbsG: number;
  proteinG: number;
  size?: number;
}) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = fatG + carbsG + proteinG || 1;

  const segments = [
    { value: fatG, color: COLORS.fat },
    { value: carbsG, color: COLORS.carbs },
    { value: proteinG, color: COLORS.protein },
  ];

  let offset = 0;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} className="fill-none stroke-black/[0.06] dark:stroke-white/[0.08]" />
      {segments.map((seg, i) => {
        const fraction = seg.value / total;
        const dash = fraction * circumference;
        const el = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            stroke={seg.color}
            className="fill-none"
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset}
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}
