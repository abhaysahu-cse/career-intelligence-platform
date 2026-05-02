'use client';
import { useEffect, useState } from 'react';
import { getReadinessColor, getReadinessLevel } from '@/lib/utils';

interface Props {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  showLevel?: boolean;
  animated?: boolean;
  className?: string;
}

export default function ScoreCircle({
  score, size = 160, strokeWidth = 12,
  showLabel = true, showLevel = true, animated = true, className = ''
}: Props) {
  const [displayed, setDisplayed] = useState(animated ? 0 : score);
  const radius       = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset        = circumference - (displayed / 100) * circumference;
  const color = getReadinessColor(displayed);
  const level = getReadinessLevel(displayed);

  useEffect(() => {
    if (!animated) { setDisplayed(score); return; }
    const duration = 1400;
    const start    = performance.now();
    const raf = (now: number) => {
      const t    = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(score * ease));
      if (t < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [score, animated]);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none"
          stroke="url(#sg)" strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.04s linear' }} />
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold tabular-nums leading-none"
            style={{ fontSize: size*0.22, fontFamily:'JetBrains Mono,monospace', color:'#E2E8F0' }}>
            {displayed}
          </span>
          {showLevel && (
            <span className="mt-1 font-medium px-2 py-0.5 rounded-full"
              style={{ fontSize: size*0.075, background:`${color}22`, color }}>
              {level}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
