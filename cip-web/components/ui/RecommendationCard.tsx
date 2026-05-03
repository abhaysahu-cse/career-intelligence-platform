'use client';
import { ArrowRight, type LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
  cta?: string;
  onClick?: () => void;
  priority?: 'high' | 'medium' | 'low';
}
export default function RecommendationCard({ title, description, icon: Icon, cta = 'Take action', onClick, priority = 'medium' }: Props) {
  const colors = {
    high:   { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)',  icon: '#FCA5A5', dot: '#EF4444' },
    medium: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', icon: '#FCD34D', dot: '#F59E0B' },
    low:    { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.25)',  icon: '#4ADE80', dot: '#22C55E' },
  }[priority];

  return (
    <div className="rounded-2xl p-4 border flex items-start gap-3 card-hover-glow"
      style={{ background: colors.bg, borderColor: colors.border }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${colors.dot}22` }}>
        <Icon size={16} style={{ color: colors.icon }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold mb-0.5" style={{ color: '#FFFFFF' }}>{title}</p>
        <p className="text-xs" style={{ color: '#A1A1AA' }}>{description}</p>
        {onClick && (
          <button onClick={onClick}
            className="flex items-center gap-1 text-xs font-medium mt-2 hover:gap-2 transition-all"
            style={{ color: colors.icon }}>
            {cta} <ArrowRight size={11} />
          </button>
        )}
      </div>
    </div>
  );
}
