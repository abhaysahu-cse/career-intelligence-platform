'use client';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  title:     string;
  value:     string | number;
  subtitle?: string;
  icon:      LucideIcon;
  iconColor?: string;
  iconBg?:   string;
  trend?:    { value: number; label: string };
  className?: string;
  onClick?:  () => void;
}

export default function StatCard({
  title, value, subtitle, icon: Icon,
  iconColor = '#818CF8', iconBg = 'rgba(79,70,229,0.15)',
  trend, className, onClick,
}: Props) {
  return (
    <div
      onClick={onClick}
      className={cn('rounded-2xl p-5 border card-hover-glow', onClick && 'cursor-pointer', className)}
      style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
          <Icon size={18} style={{ color: iconColor }} />
        </div>
        {trend && (
          <span className="text-xs font-medium px-2 py-1 rounded-lg"
            style={{
              background: trend.value >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              color:      trend.value >= 0 ? '#4ADE80' : '#FCA5A5',
            }}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: '#94A3B8' }}>{title}</p>
      <p className="text-2xl font-bold tabular-nums" style={{ fontFamily:'Syne,sans-serif', color:'#E2E8F0' }}>{value}</p>
      {subtitle && <p className="text-xs mt-1" style={{ color: '#64748B' }}>{subtitle}</p>}
      {trend && <p className="text-xs mt-1" style={{ color: '#64748B' }}>{trend.label}</p>}
    </div>
  );
}
