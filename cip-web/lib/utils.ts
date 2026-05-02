import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ReadinessLevel, RiskLevel } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getReadinessColor(score: number): string {
  if (score >= 75) return '#22C55E';
  if (score >= 50) return '#F59E0B';
  return '#EF4444';
}

export function getReadinessLevel(score: number): ReadinessLevel {
  if (score >= 75) return 'Ready to Apply';
  if (score >= 50) return 'Almost Ready';
  return 'Not Ready';
}

export function getRiskColor(risk: RiskLevel): string {
  if (risk === 'LOW')    return '#22C55E';
  if (risk === 'MEDIUM') return '#F59E0B';
  return '#EF4444';
}

export function getRiskBg(risk: RiskLevel): string {
  if (risk === 'LOW')    return 'rgba(34,197,94,0.15)';
  if (risk === 'MEDIUM') return 'rgba(245,158,11,0.15)';
  return 'rgba(239,68,68,0.15)';
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
