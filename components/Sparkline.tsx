'use client';

interface Props {
  values: number[];
  labels?: string[];
  width?: number;
  height?: number;
  color?: string;
}

/**
 * Dependency-free sparkline. Adds a faint area fill below the line and a tooltip
 * via <title> on each point so hovering shows the underlying value.
 */
export default function Sparkline({
  values,
  labels,
  width = 600,
  height = 120,
  color = '#2563eb',
}: Props) {
  if (values.length === 0) {
    return <div className="text-sm text-slate-400">Veri yok.</div>;
  }
  const pad = 6;
  const max = Math.max(...values, 1);
  const min = 0;
  const span = max - min || 1;
  const stepX = (width - pad * 2) / Math.max(values.length - 1, 1);
  const points = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (height - pad * 2) * (1 - (v - min) / span);
    return [x, y];
  });
  const linePath = points
    .map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`))
    .join(' ');
  const areaPath =
    `${linePath} L${points[points.length - 1][0]},${height - pad}` +
    ` L${points[0][0]},${height - pad} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      preserveAspectRatio="none"
      role="img"
      aria-label="Trend grafiği"
    >
      <path d={areaPath} fill={color} fillOpacity="0.08" />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.5} fill={color}>
          <title>
            {labels?.[i] ? `${labels[i]}: ` : ''}
            {values[i].toLocaleString('tr-TR')}
          </title>
        </circle>
      ))}
    </svg>
  );
}
