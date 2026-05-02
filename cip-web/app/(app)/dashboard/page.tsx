'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, Brain, Briefcase, ChevronRight, FileText, Target, Video, Zap } from 'lucide-react';
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
      description: s.breakdown.resume < 70
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
    <div className="space-y-6 pb-8">
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
            <h2 className="mb-2 text-2xl font-bold md:text-3xl" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E8F0' }}>
              You are <span className="grad-text">{s.level}</span>
            </h2>
            <p className="mb-4 text-sm" style={{ color: '#94A3B8' }}>
              Speak, get evaluated, improve weak topics, and turn that progress into stronger job matches.
            </p>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: 'Resume', val: s.breakdown.resume, color: '#4F46E5' },
                { label: 'Skills', val: s.breakdown.skills, color: '#06B6D4' },
                { label: 'Interview', val: s.breakdown.interview, color: '#22C55E' },
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
            { title: 'Resume Score', value: `${s.breakdown.resume}/100`, icon: FileText, iconColor: '#818CF8', iconBg: 'rgba(79,70,229,0.15)', trend: { value: 0, label: 'Real backend score' } },
            { title: 'Skills Score', value: `${s.breakdown.skills}/100`, icon: Brain, iconColor: '#67E8F9', iconBg: 'rgba(6,182,212,0.15)', trend: { value: 0, label: 'Resume + matching' } },
            { title: 'Interview Score', value: `${s.breakdown.interview}/100`, icon: Video, iconColor: '#4ADE80', iconBg: 'rgba(34,197,94,0.15)', trend: { value: 0, label: 'Latest evaluated answers' } },
            { title: 'Overall Score', value: `${s.readiness}/100`, icon: Target, iconColor: '#FCD34D', iconBg: 'rgba(245,158,11,0.15)', trend: { value: 0, label: 'Current readiness' } },
          ].map((card) => (
            <StatCard key={card.title} title={card.title} value={card.value} icon={card.icon} iconColor={card.iconColor} iconBg={card.iconBg} trend={card.trend} />
          ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border p-5 lg:col-span-2" style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold" style={{ fontFamily: 'Syne,sans-serif', color: '#E2E8F0' }}>Progress Tracking</h3>
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
            <h3 className="font-semibold" style={{ fontFamily: 'Syne,sans-serif', color: '#E2E8F0' }}>Next Actions</h3>
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
            <h3 className="font-semibold" style={{ fontFamily: 'Syne,sans-serif', color: '#E2E8F0' }}>Top Job Matches</h3>
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
            <div className="col-span-3 py-8 text-center" style={{ color: '#94A3B8' }}>
              <p>No recommended jobs are available yet.</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border p-5" style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold" style={{ fontFamily: 'Syne,sans-serif', color: '#E2E8F0' }}>Weak Skills</h3>
          <button onClick={() => router.push('/analytics')} className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: '#818CF8' }}>
            Progress details <ChevronRight size={12} />
          </button>
        </div>
        {a.weakSkills.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {a.weakSkills.map((skill) => (
              <div
                key={skill}
                className="rounded-xl border px-4 py-3 text-sm font-medium"
                style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)', color: '#FCD34D' }}
              >
                {skill}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            No repeated weak topic has been detected yet. A few more real interview attempts will make this sharper.
          </p>
        )}
      </div>
    </div>
  );
}
