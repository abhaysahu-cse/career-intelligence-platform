'use client';
// components/certificates/AuthenticityScore.tsx

import React from 'react';
import { getScoreColor, getStatusColor } from '@/lib/api/certificates';

interface AuthenticityScoreProps {
  score: number;
  status: string;
  confidenceLevel: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function AuthenticityScore({
  score,
  status,
  confidenceLevel,
  size = 'md',
}: AuthenticityScoreProps) {
  const color = getScoreColor(score);
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
            stroke="#f1f5f9"
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
          <span className={`${scoreSize} font-black leading-none`} style={{ color }}>
            {score}
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-gray-400 font-medium">/ 100</span>
          )}
        </div>
      </div>
      {size !== 'sm' && (
        <div className="text-center">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
            {status}
          </span>
          <p className="text-xs text-gray-400 mt-1">{confidenceLevel} confidence</p>
        </div>
      )}
    </div>
  );
}
