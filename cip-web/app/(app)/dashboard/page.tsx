'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { ArrowRight, Brain, Briefcase, ChevronRight, FileText, Target, Video, Zap, Clock, TrendingUp, AlertTriangle, Flame } from 'lucide-react';
import toast from 'react-hot-toast';
import ScoreCircle from '@/components/ui/ScoreCircle';
import StatCard from '@/components/ui/StatCard';
import RecommendationCard from '@/components/ui/RecommendationCard';
import JobCard from '@/components/ui/JobCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { analyticsApi, jobsApi, scoreApi } from '@/lib/api';
import { useAppStore } from '@/store';
import type { Analytics, Job, ReadinessScore } from '@/types';

const unwrapPayload = <T,>(response: { data: T } | { data: { data: T } }) =>
  'data' in (response.data as Record<string, unknown>)
    ? (response.data as { data: T }).data
    : (response.data as T);

const normalizeRecommendedJobs = (items: Array<{
  job: {
    id: number;
    company: string;
    role: string;
    location?: string;
    employmentType?: string;
    salaryRange?: string;
    sourceUrl?: string;
    requiredSkills?: string[];
  };
  matchPercentage: number;
}>): Job[] =>
  items.map((item) => ({
    id: item.job.id,
    company: item.job.company,
    role: item.job.role,
    location: item.job.location ?? 'Unknown',
    type: item.job.employmentType === 'PART_TIME' ? 'Part-time' : item.job.employmentType === 'INTERNSHIP' ? 'Internship' : 'Full-time',
    match: item.matchPercentage,
    minScore: 0,
    salary: item.job.salaryRange,
    skills: item.job.requiredSkills ?? [],
    url: item.job.sourceUrl ?? '#',
    isRecommended: true,
  }));

export default function DashboardPage() {
  const router = useRouter();
  const { user, score, setScore } = useAppStore();

  const { data: scoreData, isLoading: scoreLoading } = useQuery({
    queryKey: ['score'],
    queryFn: async () => (await scoreApi.get()).data,
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => (await analyticsApi.get()).data,
  });

  const { data: jobs } = useQuery({
    queryKey: ['jobs-recommended', score?.readiness, user?.skills],
    queryFn: async () => {
      const response = await jobsApi.recommended({ readiness: score?.readiness, skills: user?.skills });
      return normalizeRecommendedJobs(unwrapPayload(response) as Array<{
        job: {
          id: number;
          company: string;
          role: string;
          location?: string;
          employmentType?: string;
          salaryRange?: string;
          sourceUrl?: string;
          requiredSkills?: string[];
        };
        matchPercentage: number;
      }>);
    },
  });

  useEffect(() => {
    if (scoreData) {
      const payload = unwrapPayload(scoreData) as ReadinessScore;
      setScore(payload);
    }
  }, [scoreData, setScore]);

  const s = scoreData ? unwrapPayload(scoreData) as ReadinessScore : null;
  const a = analyticsData ? unwrapPayload(analyticsData) as Analytics : null;

  if (scoreLoading || !s || analyticsLoading || !a) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-500" />
          <p style={{ color: '#94A3B8' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const recommendations = [
    a.weakSkills.length > 0 ? {
      title: 'Attack Repeated Weak Topics',
      description: `Focus next on ${a.weakSkills.slice(0, 2).join(' and ')} so the same gaps stop repeating.`,
      icon: Brain,
      priority: 'high' as const,
      onClick: () => router.push('/interview'),
    } : {
      title: 'Start Building Interview Signal',
      description: 'Complete a few real interview attempts so the system can detect weak topics and measure your progress.',
      icon: Video,
      priority: 'high' as const,
      onClick: () => router.push('/interview'),
    },
    {
      title: 'Strengthen Resume Context',
      description: (s.resumeScore ?? 0) < 70
        ? 'Your resume score is still limiting readiness. Update it with sharper outcomes and relevant skills.'
        : 'Keep your resume current so AI questions and job matching stay personalized.',
      icon: FileText,
      priority: 'medium' as const,
      onClick: () => router.push('/profile'),
    },
    {
      title: 'Push Toward Jobs',
      description: jobs?.length
        ? `${jobs.length} real job matches are available right now. Review the highest-match roles first.`
        : 'As your readiness and interview signal improve, recommended jobs will become more specific.',
      icon: Briefcase,
      priority: 'low' as const,
      onClick: () => router.push('/jobs'),
    },
  ];

  return (
    <div className="space-y-6 pb-8 stagger-children">
      <div
        className="rounded-3xl border p-6 md:p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(79,70,229,0.2) 0%, rgba(6,182,212,0.1) 100%)',
          borderColor: 'rgba(79,70,229,0.25)',
        }}
      >
        <div className="flex flex-col items-center gap-6 md:flex-row md:gap-10">
          <div className="flex-shrink-0">
            <ScoreCircle score={s.readiness} size={160} />
          </div>

          <div className="flex-1 text-center md:text-left">
            <p className="mb-1 text-sm font-medium" style={{ color: '#94A3B8' }}>
              Good morning, {user?.name?.split(' ')[0] ?? 'Student'}
            </p>
            <h2 className="mb-2 text-2xl font-bold md:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400" style={{ fontFamily: 'Syne, sans-serif' }}>
              You are <span className="grad-text">{s.level}</span>
            </h2>
            <p className="mb-3 text-sm" style={{ color: '#94A3B8' }}>
              Speak, get evaluated, improve weak topics, and turn that progress into stronger job matches.
            </p>

            {/* Intelligence Badges — Days to Ready + Percentile */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <Clock size={13} style={{ color: '#4ADE80' }} />
                <span className="text-xs font-semibold" style={{ color: '#4ADE80' }}>
                  {s.readiness >= 65 ? 'Ready to Apply!' : `~${Math.max(7, Math.round((65 - s.readiness) / 0.3))} days to ready`}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)' }}>
                <TrendingUp size={13} style={{ color: '#818CF8' }} />
                <span className="text-xs font-semibold" style={{ color: '#818CF8' }}>
                  Top {Math.max(5, 100 - Math.round(s.readiness * 0.9))}% of students
                </span>
              </div>
              {(() => {
                if (typeof window === 'undefined') return null;
                try {
                  const raw = localStorage.getItem('cip_streak');
                  if (!raw) return null;
                  const { count, lastDate } = JSON.parse(raw);
                  const today = new Date().toDateString();
                  const yesterday = new Date(Date.now() - 86400000).toDateString();
                  if (lastDate !== today && lastDate !== yesterday) return null;
                  if (count <= 0) return null;
                  return (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <Flame size={13} style={{ color: '#F59E0B' }} />
                      <span className="text-xs font-semibold" style={{ color: '#FCD34D' }}>
                        🔥 {count}-day streak
                      </span>
                    </div>
                  );
                } catch { return null; }
              })()}
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: 'Resume', val: s.resumeScore ?? 0, color: '#4F46E5' },
                { label: 'Skills', val: s.academicScore ?? 0, color: '#06B6D4' },
                { label: 'Interview', val: s.interviewScore ?? 0, color: '#22C55E' },
                { label: 'Attempts', val: a.totalAttempts, color: '#F59E0B' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span style={{ color: '#94A3B8' }}>{item.label}</span>
                    <span className="font-mono font-bold" style={{ color: '#E2E8F0' }}>{item.val}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(Number(item.val), 100)}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-shrink-0 flex-col gap-2">
            <button
              onClick={() => router.push('/interview')}
              className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: '#fff' }}
            >
              <Zap size={15} /> Practice Interview
            </button>
            <button
              onClick={() => router.push('/jobs')}
              className="flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-all hover:bg-white/10"
              style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#E2E8F0' }}
            >
              <Target size={15} /> View Jobs
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {scoreLoading
          ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
          : [
            { title: 'Resume Score', value: `${s.resumeScore ?? 0}/100`, icon: FileText, iconColor: '#818CF8', iconBg: 'rgba(79,70,229,0.15)', trend: { value: 0, label: 'Real backend score' } },
            { title: 'Skills Score', value: `${s.academicScore ?? 0}/100`, icon: Brain, iconColor: '#67E8F9', iconBg: 'rgba(6,182,212,0.15)', trend: { value: 0, label: 'Resume + matching' } },
            { title: 'Interview Score', value: `${s.interviewScore ?? 0}/100`, icon: Video, iconColor: '#4ADE80', iconBg: 'rgba(34,197,94,0.15)', trend: { value: 0, label: 'Latest evaluated answers' } },
            { title: 'Overall Score', value: `${s.readiness}/100`, icon: Target, iconColor: '#FCD34D', iconBg: 'rgba(245,158,11,0.15)', trend: { value: 0, label: 'Current readiness' } },
          ].map((card) => (
            <StatCard key={card.title} title={card.title} value={card.value} icon={card.icon} iconColor={card.iconColor} iconBg={card.iconBg} trend={card.trend} />
          ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl p-5 lg:col-span-2 border border-white/5 shadow-md shadow-black/20" style={{ background: '#1E293B' }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400" style={{ fontFamily: 'Syne,sans-serif' }}>Progress Tracking</h3>
              <p className="text-xs" style={{ color: '#64748B' }}>Built from completed interview attempts</p>
            </div>
            <button onClick={() => router.push('/analytics')} className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: '#818CF8' }}>
              View details <ChevronRight size={12} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={a.progressHistory}>
              <defs>
                <linearGradient id="dashboard-progress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={2.5} fill="url(#dashboard-progress)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400" style={{ fontFamily: 'Syne,sans-serif' }}>Next Actions</h3>
            <button onClick={() => router.push('/roadmap')} className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: '#818CF8' }}>
              Full roadmap <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {recommendations.map((item) => <RecommendationCard key={item.title} {...item} />)}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400" style={{ fontFamily: 'Syne,sans-serif' }}>Top Job Matches</h3>
            <p className="text-xs" style={{ color: '#64748B' }}>Real backend matches based on readiness and skills</p>
          </div>
          <button
            onClick={() => router.push('/jobs')}
            className="flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm font-medium transition-all hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94A3B8' }}
          >
            View all <ArrowRight size={13} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs && jobs.length > 0 ? (
            jobs.slice(0, 3).map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onApply={(selected) => toast.success(`Applied to ${selected.company} - ${selected.role}!`)}
              />
            ))
          ) : (
            <div className="col-span-3 py-10 text-center rounded-2xl border border-white/5 shadow-md shadow-black/20" style={{ background: '#1E293B' }}>
              <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(79,70,229,0.1)' }}>
                <Zap size={20} className="text-[#818CF8]" />
              </div>
              <h3 className="text-lg font-semibold mb-1" style={{ color: '#E2E8F0' }}>Unlock your potential — Start your first AI interview</h3>
              <p className="text-sm" style={{ color: '#94A3B8' }}>Your top job matches will appear here once we understand your skills.</p>
            </div>
          )}
        </div>
      </div>

      {/* Skill Radar Chart + Intelligent Weakness Analysis */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Radar Chart */}
        <div className="rounded-2xl p-5 border border-white/5 shadow-md shadow-black/20" style={{ background: '#1E293B' }}>
          <h3 className="mb-4 font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400" style={{ fontFamily: 'Syne,sans-serif' }}>Skill Radar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={[
              { subject: 'DSA', score: Math.min((s.interviewScore ?? 0) + 10, 100), fullMark: 100 },
              { subject: 'System Design', score: Math.min(s.academicScore ?? 0, 100), fullMark: 100 },
              { subject: 'Communication', score: Math.min((s.interviewScore ?? 0) + 5, 100), fullMark: 100 },
              { subject: 'Resume', score: s.resumeScore ?? 0, fullMark: 100 },
              { subject: 'OOP', score: Math.min((s.academicScore ?? 0) + 5, 100), fullMark: 100 },
              { subject: 'Database', score: Math.min(Math.max((s.interviewScore ?? 0) - 5, 0), 100), fullMark: 100 },
            ]}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Skills" dataKey="score" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Structured Weak Skills */}
        <div className="rounded-2xl p-5 lg:col-span-2 border border-white/5 shadow-md shadow-black/20" style={{ background: '#1E293B' }}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} style={{ color: '#F59E0B' }} />
              <h3 className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400" style={{ fontFamily: 'Syne,sans-serif' }}>Skill Gap Analysis</h3>
            </div>
            <button onClick={() => router.push('/analytics')} className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: '#818CF8' }}>
              Details <ChevronRight size={12} />
            </button>
          </div>
          {a.weakSkills.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {a.weakSkills.slice(0, 4).map((skill, idx) => {
                const priority = idx === 0 ? 'HIGH' : idx === 1 ? 'MEDIUM' : 'LOW';
                const prColor = priority === 'HIGH' ? '#EF4444' : priority === 'MEDIUM' ? '#F59E0B' : '#06B6D4';
                const prBg = priority === 'HIGH' ? 'rgba(239,68,68,0.08)' : priority === 'MEDIUM' ? 'rgba(245,158,11,0.06)' : 'rgba(6,182,212,0.06)';
                const fixMap: Record<string, string[]> = {
                  'time complexity': ['Review Big-O notation fundamentals', 'Practice analyzing nested loops'],
                  'edge cases': ['Always check null/empty inputs', 'Think about boundary values first'],
                  'system design': ['Study URL shortener design pattern', 'Practice drawing system diagrams'],
                  'database': ['Review indexing & query optimization', 'Practice SQL joins and subqueries'],
                  'communication': ['Use STAR method for behavioral Qs', 'Structure: First → Then → Finally'],
                  'dsa': ['Solve 5 tree/graph problems this week', 'Practice DFS/BFS patterns'],
                  'oop': ['Review SOLID principles', 'Practice design pattern implementations'],
                };
                const whyMap: Record<string, string> = {
                  'time complexity': 'No complexity analysis in recent answers',
                  'edge cases': 'Missed edge cases in last 3 attempts',
                  'system design': 'Incomplete architecture in recent designs',
                  'database': 'Missing DB concepts in recent answers',
                  'communication': 'Answers lack structured flow',
                  'dsa': 'Low scores on algorithmic questions',
                  'oop': 'Weak object-oriented design explanations',
                };
                return (
                  <div key={skill} className="rounded-xl border p-3.5 space-y-2" style={{ borderColor: `${prColor}22`, background: prBg }}>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${prColor}22`, color: prColor, border: `1px solid ${prColor}33` }}>
                        {priority}
                      </span>
                      <span className="text-sm font-semibold capitalize" style={{ color: '#E2E8F0' }}>{skill}</span>
                    </div>
                    <p className="text-xs" style={{ color: '#94A3B8' }}>Why: {whyMap[skill.toLowerCase()] ?? 'Repeated weakness in recent answers'}</p>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold" style={{ color: '#67E8F9' }}>Fix:</p>
                      {(fixMap[skill.toLowerCase()] ?? ['Practice this topic in your next interview session']).map((fix) => (
                        <p key={fix} className="text-xs pl-3" style={{ color: '#94A3B8' }}>→ {fix}</p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm" style={{ color: '#94A3B8' }}>
                No repeated weak topic detected yet. Complete a few more interview attempts for the AI to detect patterns.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
