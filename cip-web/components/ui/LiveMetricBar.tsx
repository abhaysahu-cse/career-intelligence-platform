'use client';
interface Props {
  label: string;
  value: number;
  color?: string;
}
export default function LiveMetricBar({ label, value, color = '#4F46E5' }: Props) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span style={{ color: '#94A3B8' }}>{label}</span>
        <span className="font-mono font-bold" style={{ color: '#E2E8F0' }}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
      </div>
    </div>
  );
}
