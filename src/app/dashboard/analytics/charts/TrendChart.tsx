"use client";

import { useId, useMemo } from "react";
import { motion } from "motion/react";

const WIDTH = 480;
const HEIGHT = 160;
const PAD_X = 8;
const PAD_Y = 16;

export function TrendChart({
  data,
  formatValue,
  color = "var(--accent)",
}: {
  data: { label: string; value: number }[];
  formatValue?: (n: number) => string;
  color?: string;
}) {
  const gradientId = useId();
  const render = formatValue ?? ((n: number) => n.toString());
  const max = Math.max(1, ...data.map((d) => d.value));

  const points = useMemo(() => {
    const innerWidth = WIDTH - PAD_X * 2;
    const innerHeight = HEIGHT - PAD_Y * 2;
    return data.map((d, i) => {
      const x = PAD_X + (data.length === 1 ? innerWidth / 2 : (i / (data.length - 1)) * innerWidth);
      const y = PAD_Y + innerHeight - (d.value / max) * innerHeight;
      return { x, y, ...d };
    });
  }, [data, max]);

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x.toFixed(1)} ${HEIGHT - PAD_Y} L ${points[0]?.x.toFixed(1)} ${HEIGHT - PAD_Y} Z`;

  const allZero = data.every((d) => d.value === 0);

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full overflow-visible" role="presentation">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {!allZero && (
          <motion.path
            d={areaPath}
            fill={`url(#${gradientId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
        )}
        <motion.path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
        {points.map((p, i) => (
          <motion.circle
            key={p.label + i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={color}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + i * 0.05, type: "spring", stiffness: 400, damping: 20 }}
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        {points.map((p, i) => (
          <span key={p.label + i} title={render(p.value)}>
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}
