// components/Sparkline.tsx
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
}

export function Sparkline({ data, width = 520, height = 40, stroke = '#6ea8ff' }: SparklineProps) {
  if (!data.length) return null;
  const max = Math.max(...data, 100);
  const min = Math.min(...data, 0);
  const rango = max - min || 1;
  const puntos = data
    .map((v, idx) => {
      const x = (idx / Math.max(1, data.length - 1)) * (width - 4) + 2;
      const y = height - 4 - ((v - min) / rango) * (height - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const final = data[data.length - 1] ?? 0;

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline
        points={puntos}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <text x={width - 4} y={12} textAnchor="end" fontSize={10} fill="#9fb3ff">
        {final.toFixed(1)}%
      </text>
      <text x={4} y={12} fontSize={10} fill="#9fb3ff">
        Índice
      </text>
    </svg>
  );
}