'use client';
import { useQuery } from '@tanstack/react-query';
import {
  Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { AlertTriangle, Brain, LineChart as LineChartIcon, Target } from 'lucide-react';
import { analyticsApi } from '@/lib/api';
import type { Analytics } from '@/types';

const unwrapPayload = <T,>(response: { data: T } | { data: { data: T } }) =>
  'data' in (response.data as Record<string, unknown>)
    ? (response.data as { data: T }).data
    : (response.data as T);

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => (await analyticsApi.get()).data,
  });

  if (isLoading || !analytics) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-500" />
          <p style={{ color: '#A1A1AA' }}>Loading progress...</p>
        </div>
      </div>
    );
  }

  const a = unwrapPayload(analytics) as Analytics;

  return (
    <div className="space-y-6 pb-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { title: 'Readiness', value: a.readiness.toFixed(0), icon: Target, color: '#818CF8' },
          { title: 'Risk', value: a.risk, icon: AlertTriangle, color: a.risk === 'LOW' ? '#4ADE80' : a.risk === 'MEDIUM' ? '#FBBF24' : '#F87171' },
          { title: 'Avg Interview', value: a.averageInterviewScore.toFixed(0), icon: LineChartIcon, color: '#67E8F9' },
          { title: 'Attempts', value: a.totalAttempts, icon: Brain, color: '#F59E0B' },
        ].map((card) => (
          <div key={card.title} className="rounded-2xl border p-5" style={{ background: '#0A0A0A', borderColor: 'rgba(255,255,255,0.08)' }}>
            <card.icon size={18} style={{ color: card.color }} />
            <p className="mb-1 mt-3 text-sm" style={{ color: '#A1A1AA' }}>{card.title}</p>
            <p className="text-2xl font-bold" style={{ color: '#FFFFFF', fontFamily: 'Syne,sans-serif' }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border p-5" style={{ background: '#0A0A0A', borderColor: 'rgba(255,255,255,0.08)' }}>
          <h3 className="mb-1 font-semibold" style={{ color: '#FFFFFF', fontFamily: 'Syne,sans-serif' }}>Readiness Progress</h3>
          <p className="mb-4 text-xs" style={{ color: '#71717A' }}>Based on real completed interview attempts</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={a.progressHistory}>
              <defs>
                <linearGradient id="analytics-progress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="score" stroke="#4F46E5" fill="url(#analytics-progress)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border p-5" style={{ background: '#0A0A0A', borderColor: 'rgba(255,255,255,0.08)' }}>
          <h3 className="mb-1 font-semibold" style={{ color: '#FFFFFF', fontFamily: 'Syne,sans-serif' }}>Interview Trend</h3>
          <p className="mb-4 text-xs" style={{ color: '#71717A' }}>How your interview scores are changing over time</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={a.interviewHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
              <Line type="monotone" dataKey="score" stroke="#22C55E" strokeWidth={2.5} dot={{ fill: '#22C55E', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border p-5" style={{ background: '#0A0A0A', borderColor: 'rgba(255,255,255,0.08)' }}>
          <h3 className="mb-3 font-semibold" style={{ color: '#FFFFFF', fontFamily: 'Syne,sans-serif' }}>Weak Skills</h3>
          {a.weakSkills.length ? (
            <div className="flex flex-wrap gap-2">
              {a.weakSkills.map((skill) => (
                <span key={skill} className="rounded-full border px-3 py-1.5 text-sm" style={{ borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.08)', color: '#FCD34D' }}>
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#A1A1AA' }}>No repeated weak topic has shown up yet. Keep answering and the system will surface patterns.</p>
          )}
        </div>

        <div className="rounded-2xl border p-5" style={{ background: '#0A0A0A', borderColor: 'rgba(255,255,255,0.08)' }}>
          <h3 className="mb-3 font-semibold" style={{ color: '#FFFFFF', fontFamily: 'Syne,sans-serif' }}>Recommendation</h3>
          <p className="text-sm leading-6" style={{ color: '#A1A1AA' }}>
            {a.latestRecommendation || 'Complete a few interview attempts and upload your resume to unlock more targeted coaching.'}
          </p>
        </div>
      </div>
    </div>
  );
}
