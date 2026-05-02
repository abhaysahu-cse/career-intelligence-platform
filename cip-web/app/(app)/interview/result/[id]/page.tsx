'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip
} from 'recharts';
import {
  CheckCircle2, XCircle, Lightbulb, ArrowLeft,
  Clock, RotateCcw, Trophy
} from 'lucide-react';
import { interviewApi } from '@/lib/api';

export default function InterviewResultPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const { data: result } = useQuery({
    queryKey: ['interview-result', id],
    queryFn: async () => {
      try { return (await interviewApi.getResult(id)).data; }
      catch (error) { 
        console.error('Failed to fetch interview result:', error);
        return null; 
      }
    },
  });

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p style={{ color: '#94A3B8' }}>Loading interview results...</p>
        </div>
      </div>
    );
  }

  const r = result as {
    role: string;
    date: string;
    duration: number;
    scores: {
      technical: number;
      communication: number;
      confidence: number;
      overall: number;
    };
    mistakes: Array<{ question: string; feedback: string }>;
    suggestions: string[];
  };

  const radarData = [
    { subject: 'Technical',      score: r.scores.technical     },
    { subject: 'Communication',  score: r.scores.communication },
    { subject: 'Confidence',     score: r.scores.confidence    },
  ];

  const getColor = (s: number) => s >= 75 ? '#22C55E' : s >= 50 ? '#F59E0B' : '#EF4444';
  const getBg    = (s: number) => s >= 75 ? 'rgba(34,197,94,0.12)' : s >= 50 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';

  return (
    <div className="space-y-6 pb-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.push('/interview')}
          className="p-2 rounded-xl border transition-all hover:bg-white/5 flex-shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94A3B8' }}>
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Syne,sans-serif', color: '#E2E8F0' }}>
            Interview Results
          </h2>
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            {r.role} • {new Date(r.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })} •{' '}
            <Clock size={11} className="inline" /> {r.duration} min
          </p>
        </div>
        <button onClick={() => router.push('/interview')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:bg-white/5"
          style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94A3B8' }}>
          <RotateCcw size={13} /> Retake
        </button>
      </div>

      {/* Overall score hero */}
      <div className="rounded-3xl p-6 border text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,rgba(79,70,229,0.2),rgba(6,182,212,0.1))', borderColor: 'rgba(79,70,229,0.25)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none opacity-10"
          style={{ background: 'radial-gradient(circle,#06B6D4,transparent 70%)', transform:'translate(30%,-30%)' }} />
        <Trophy size={28} className="mx-auto mb-3" style={{ color: '#FCD34D' }} />
        <p className="text-sm mb-2" style={{ color: '#94A3B8' }}>Overall Score</p>
        <p className="text-6xl font-bold grad-text" style={{ fontFamily: 'JetBrains Mono,monospace' }}>
          {r.scores.overall}
        </p>
        <p className="text-sm mt-2" style={{ color: '#94A3B8' }}>
          {r.scores.overall >= 75 ? '🎉 Excellent performance!' : r.scores.overall >= 50 ? '👍 Good effort, keep improving' : '📚 More practice recommended'}
        </p>
      </div>

      {/* Score breakdown + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score cards */}
        <div className="space-y-3">
          <h3 className="font-semibold" style={{ fontFamily:'Syne,sans-serif', color:'#E2E8F0' }}>Score Breakdown</h3>
          {[
            { label: 'Technical',     score: r.scores.technical,     desc: 'Problem solving, DSA, CS concepts' },
            { label: 'Communication', score: r.scores.communication, desc: 'Clarity, structure, articulation' },
            { label: 'Confidence',    score: r.scores.confidence,    desc: 'Tone, pace, eye contact' },
          ].map(item => (
            <div key={item.label} className="rounded-2xl p-4 border"
              style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#E2E8F0' }}>{item.label}</p>
                  <p className="text-xs" style={{ color: '#64748B' }}>{item.desc}</p>
                </div>
                <span className="text-xl font-bold tabular-nums px-3 py-1 rounded-xl"
                  style={{ fontFamily:'JetBrains Mono,monospace', background: getBg(item.score), color: getColor(item.score) }}>
                  {item.score}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${item.score}%`, background: getColor(item.score) }} />
              </div>
            </div>
          ))}
        </div>

        {/* Radar */}
        <div className="rounded-2xl p-5 border" style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }}>
          <h3 className="font-semibold mb-1" style={{ fontFamily:'Syne,sans-serif', color:'#E2E8F0' }}>Performance Radar</h3>
          <p className="text-xs mb-4" style={{ color: '#64748B' }}>Visual breakdown of your interview dimensions</p>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background:'#1E293B', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', color:'#E2E8F0' }}
              />
              <Radar name="Score" dataKey="score" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.25} strokeWidth={2.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Mistakes */}
      {r.mistakes.length > 0 && (
        <div className="rounded-2xl p-5 border" style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ fontFamily:'Syne,sans-serif', color:'#E2E8F0' }}>
            <XCircle size={16} style={{ color: '#EF4444' }} /> Areas to Improve
          </h3>
          <div className="space-y-3">
            {r.mistakes.map((m: { question: string; feedback: string }, i: number) => (
              <div key={i} className="rounded-xl p-4 border"
                style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' }}>
                <p className="text-sm font-medium mb-1" style={{ color: '#FCA5A5' }}>
                  Q: {m.question}
                </p>
                <p className="text-xs" style={{ color: '#94A3B8' }}>{m.feedback}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className="rounded-2xl p-5 border" style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }}>
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ fontFamily:'Syne,sans-serif', color:'#E2E8F0' }}>
          <Lightbulb size={16} style={{ color: '#FCD34D' }} /> Suggestions for Next Session
        </h3>
        <div className="space-y-2">
          {r.suggestions.map((s: string, i: number) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl border"
              style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.15)' }}>
              <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
              <p className="text-sm" style={{ color: '#E2E8F0' }}>{s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => router.push('/interview')}
          className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
          style={{ background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: '#fff' }}>
          Practice Again
        </button>
        <button onClick={() => router.push('/roadmap')}
          className="flex-1 py-3 rounded-xl font-semibold text-sm border transition-all hover:bg-white/5"
          style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94A3B8' }}>
          View Roadmap
        </button>
      </div>
    </div>
  );
}
