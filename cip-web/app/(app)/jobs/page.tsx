'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Search, Filter, Zap, X } from 'lucide-react';
import { jobsApi } from '@/lib/api';
import JobCard from '@/components/ui/JobCard';
import ScoreCircle from '@/components/ui/ScoreCircle';
import { useAppStore } from '@/store';
import type { Job } from '@/types';

const ROLES     = ['All Roles', 'SWE Intern', 'Backend Intern', 'Frontend Dev', 'Data Analyst', 'SDE-1', 'Systems Engineer'];
const LOCATIONS = ['All Locations', 'Bangalore', 'Hyderabad', 'Delhi', 'Pune', 'Remote'];
const TYPES     = ['All Types', 'Internship', 'Full-time', 'Part-time'];

const unwrapPayload = <T,>(response: { data: T } | { data: { data: T } }) =>
  'data' in (response.data as Record<string, unknown>)
    ? (response.data as { data: T }).data
    : (response.data as T);

const normalizeJobs = (payload: { content?: Array<{
  id: number;
  company: string;
  role: string;
  location?: string;
  employmentType?: string;
  minimumReadinessScore?: number;
  salaryRange?: string;
  requiredSkills?: string[];
  sourceUrl?: string;
}> } | Array<{
  id: number;
  company: string;
  role: string;
  location?: string;
  employmentType?: string;
  minimumReadinessScore?: number;
  salaryRange?: string;
  requiredSkills?: string[];
  sourceUrl?: string;
}>): Job[] => {
  const items = Array.isArray(payload) ? payload : payload.content ?? [];
  return items.map((item) => ({
    id: item.id,
    company: item.company,
    role: item.role,
    location: item.location ?? 'Unknown',
    type: item.employmentType === 'PART_TIME' ? 'Part-time' : item.employmentType === 'INTERNSHIP' ? 'Internship' : 'Full-time',
    match: 100,
    minScore: item.minimumReadinessScore ?? 0,
    salary: item.salaryRange,
    skills: item.requiredSkills ?? [],
    url: item.sourceUrl ?? '#',
    isRecommended: false,
  }));
};

export default function JobsPage() {
  const user = useAppStore(s => s.user);
  const score = useAppStore(s => s.score);
  const [search, setSearch]               = useState('');
  const [roleFilter, setRoleFilter]       = useState('All Roles');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  const [typeFilter, setTypeFilter]       = useState('All Types');
  const [onlyRecommended, setOnlyRecommended] = useState(false);
  const [minMatch, setMinMatch]           = useState(0);
  const [applied, setApplied]             = useState<Set<number>>(new Set());

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      try {
        const response = await jobsApi.list();
        return normalizeJobs(unwrapPayload(response) as { content?: Array<{
          id: number;
          company: string;
          role: string;
          location?: string;
          employmentType?: string;
          minimumReadinessScore?: number;
          salaryRange?: string;
          requiredSkills?: string[];
          sourceUrl?: string;
        }> });
      }
      catch (error) { 
        console.error('Failed to fetch jobs:', error);
        return []; 
      }
    },
  });

  const { data: recommendedJobs } = useQuery({
    queryKey: ['jobs-recommended', score?.readiness, user?.skills],
    enabled: Boolean(score?.readiness),
    queryFn: async () => {
      try {
        const response = await jobsApi.recommended({ readiness: score?.readiness, skills: user?.skills });
        const payload = unwrapPayload(response) as Array<{
          job: {
            id: number;
            company: string;
            role: string;
            location?: string;
            employmentType?: string;
            minimumReadinessScore?: number;
            salaryRange?: string;
            requiredSkills?: string[];
            sourceUrl?: string;
          };
          matchPercentage: number;
        }>;

        return payload.map((item) => ({
          id: item.job.id,
          company: item.job.company,
          role: item.job.role,
          location: item.job.location ?? 'Unknown',
          type: item.job.employmentType === 'PART_TIME' ? 'Part-time' : item.job.employmentType === 'INTERNSHIP' ? 'Internship' : 'Full-time',
          match: item.matchPercentage,
          minScore: item.job.minimumReadinessScore ?? 0,
          salary: item.job.salaryRange,
          skills: item.job.requiredSkills ?? [],
          url: item.job.sourceUrl ?? '#',
          isRecommended: true,
        } satisfies Job));
      } catch (error) {
        console.error('Failed to fetch recommended jobs:', error);
        return [] as Job[];
      }
    },
  });

  const recommendedMap = new Map((recommendedJobs ?? []).map((job) => [job.id, job]));
  const allJobs = (jobs ?? []).map((job) => recommendedMap.get(job.id) ?? job);

  const filtered = allJobs.filter(j => {
    if (onlyRecommended && !j.isRecommended) return false;
    if (roleFilter     !== 'All Roles'      && !j.role.toLowerCase().includes(roleFilter.toLowerCase().replace('all roles',''))) return false;
    if (locationFilter !== 'All Locations'  && j.location !== locationFilter) return false;
    if (typeFilter     !== 'All Types'      && j.type !== typeFilter) return false;
    if (minMatch > 0   && j.match < minMatch) return false;
    if (search && !j.company.toLowerCase().includes(search.toLowerCase()) &&
        !j.role.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleApply = (job: Job) => {
    setApplied(prev => {
      const next = new Set(prev);
      next.add(job.id);
      return next;
    });
    toast.success(`Applied to ${job.company} – ${job.role}!`);
  };

  const clearFilters = () => {
    setSearch(''); setRoleFilter('All Roles'); setLocationFilter('All Locations');
    setTypeFilter('All Types'); setMinMatch(0); setOnlyRecommended(false);
  };
  const hasFilters = search || roleFilter !== 'All Roles' || locationFilter !== 'All Locations' ||
                     typeFilter !== 'All Types' || minMatch > 0 || onlyRecommended;

  return (
    <div className="space-y-6 pb-8">
      {/* Header + Score mini */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1">
          <h2 className="text-xl font-bold" style={{ fontFamily:'Syne,sans-serif', color:'#FFFFFF' }}>
            Jobs & Internships
          </h2>
          <p className="text-sm" style={{ color:'#A1A1AA' }}>
            {filtered.length} opportunities matched • Based on your readiness score
          </p>
        </div>
        {score && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl border flex-shrink-0"
            style={{ background:'#0A0A0A', borderColor:'rgba(255,255,255,0.08)' }}>
            <ScoreCircle score={score.readiness} size={52} strokeWidth={6} showLevel={false} />
            <div>
              <p className="text-xs" style={{ color:'#A1A1AA' }}>Your Score</p>
              <p className="text-sm font-semibold" style={{ color:'#FFFFFF' }}>{score.level}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4 border space-y-3" style={{ background:'#0A0A0A', borderColor:'rgba(255,255,255,0.08)' }}>
        {/* Search + recommended toggle */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'#71717A' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search companies or roles…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border transition-all"
              style={{ background:'rgba(255,255,255,0.04)', borderColor:'rgba(255,255,255,0.08)', color:'#FFFFFF' }} />
          </div>
          <button onClick={() => setOnlyRecommended(!onlyRecommended)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all flex-shrink-0"
            style={onlyRecommended
              ? { background:'rgba(79,70,229,0.2)', borderColor:'rgba(79,70,229,0.5)', color:'#818CF8' }
              : { background:'rgba(255,255,255,0.04)', borderColor:'rgba(255,255,255,0.08)', color:'#A1A1AA' }}>
            <Zap size={13} /> Only Recommended
          </button>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-2">
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm border appearance-none transition-all"
            style={{ background:'rgba(255,255,255,0.04)', borderColor:'rgba(255,255,255,0.08)', color:'#A1A1AA' }}>
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
          <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm border appearance-none transition-all"
            style={{ background:'rgba(255,255,255,0.04)', borderColor:'rgba(255,255,255,0.08)', color:'#A1A1AA' }}>
            {LOCATIONS.map(l => <option key={l}>{l}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm border appearance-none transition-all"
            style={{ background:'rgba(255,255,255,0.04)', borderColor:'rgba(255,255,255,0.08)', color:'#A1A1AA' }}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={minMatch} onChange={e => setMinMatch(Number(e.target.value))}
            className="px-3 py-2 rounded-xl text-sm border appearance-none transition-all"
            style={{ background:'rgba(255,255,255,0.04)', borderColor:'rgba(255,255,255,0.08)', color:'#A1A1AA' }}>
            <option value={0}>Any Match</option>
            <option value={60}>60%+ Match</option>
            <option value={75}>75%+ Match</option>
            <option value={85}>85%+ Match</option>
          </select>
          {hasFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm transition-all hover:bg-white/5"
              style={{ color:'#EF4444', border:'1px solid rgba(239,68,68,0.3)' }}>
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Matched',  value: filtered.length,                           color: '#818CF8' },
          { label: 'Recommended',    value: filtered.filter(j=>j.isRecommended).length, color: '#22C55E' },
          { label: 'High Match 80%+',value: filtered.filter(j=>j.match>=80).length,    color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 border text-center"
            style={{ background:'#0A0A0A', borderColor:'rgba(255,255,255,0.08)' }}>
            <p className="text-2xl font-bold" style={{ fontFamily:'Syne,sans-serif', color: s.color }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color:'#71717A' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Job Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border" style={{ background:'#0A0A0A', borderColor:'rgba(255,255,255,0.08)' }}>
          <Filter size={32} className="mx-auto mb-3" style={{ color:'#4F46E5' }} />
          <p className="font-semibold" style={{ color:'#FFFFFF' }}>No jobs match your filters</p>
          <p className="text-sm mt-1" style={{ color:'#A1A1AA' }}>Try adjusting your filters</p>
          <button onClick={clearFilters} className="mt-4 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background:'rgba(79,70,229,0.15)', color:'#818CF8' }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(job => (
            <div key={job.id} className="relative">
              {applied.has(job.id) && (
                <div className="absolute inset-0 rounded-2xl z-10 flex items-center justify-center pointer-events-none"
                  style={{ background:'rgba(34,197,94,0.08)', border:'2px solid rgba(34,197,94,0.4)' }}>
                  <span className="font-bold text-sm" style={{ color:'#22C55E' }}>✓ Applied</span>
                </div>
              )}
              <JobCard job={job} onApply={handleApply} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
