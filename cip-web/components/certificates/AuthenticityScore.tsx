'use client';
// components/certificates/AuthenticityScore.tsx

import React from 'react';
import { getScoreColor } from '@/lib/api/certificates';

interface AuthenticityScoreProps {
  score: number;
  status: string;
  confidenceLevel: string;
  size?: 'sm' | 'md' | 'lg';
}

const getStatusStyle = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'genuine': return { bg: 'rgba(34,197,94,0.12)', color: '#4ADE80' };
    case 'likely genuine': return { bg: 'rgba(132,204,22,0.12)', color: '#A3E635' };
    case 'suspicious': return { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24' };
    case 'likely fake': return { bg: 'rgba(249,115,22,0.12)', color: '#FB923C' };
    case 'fake': return { bg: 'rgba(239,68,68,0.12)', color: '#FCA5A5' };
    default: return { bg: 'rgba(255,255,255,0.06)', color: '#94A3B8' };
  }
};

export default function AuthenticityScore({
  score,
  status,
  confidenceLevel,
  size = 'md',
}: AuthenticityScoreProps) {
  const color = getScoreColor(score);
  const sts = getStatusStyle(status);
  const radius = size === 'lg' ? 54 : size === 'sm' ? 30 : 42;
  const viewBoxSize = (radius + 12) * 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const containerSize = size === 'lg' ? 'w-40 h-40' : size === 'sm' ? 'w-20 h-20' : 'w-28 h-28';
  const scoreSize = size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-lg' : 'text-2xl';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${containerSize}`}>
        <svg
          className="w-full h-full -rotate-90"
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        >
          <circle
            cx={viewBoxSize / 2}
            cy={viewBoxSize / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          <circle
            cx={viewBoxSize / 2}
            cy={viewBoxSize / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${scoreSize} font-black leading-none font-mono`} style={{ color }}>
            {score}
          </span>
          {size !== 'sm' && (
            <span className="text-xs font-medium" style={{ color: '#64748B' }}>/ 100</span>
          )}
        </div>
      </div>
      {size !== 'sm' && (
        <div className="text-center">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: sts.bg, color: sts.color }}>
            {status}
          </span>
          <p className="text-xs mt-1" style={{ color: '#64748B' }}>{confidenceLevel} confidence</p>
        </div>
      )}
    </div>
  );
}
