'use client';
import { MapPin, Clock, ExternalLink, Zap } from 'lucide-react';
import type { Job } from '@/types';

interface Props {
  job: Job;
  onApply: (job: Job) => void;
}

export default function JobCard({ job, onApply }: Props) {
  const matchColor = job.match >= 80 ? '#22C55E' : job.match >= 60 ? '#F59E0B' : '#EF4444';
  const matchBg    = job.match >= 80 ? 'rgba(34,197,94,0.12)' : job.match >= 60 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';

  return (
    <div className="rounded-2xl p-5 border card-hover-glow flex flex-col gap-3"
      style={{ background: '#1E293B', borderColor: job.isRecommended ? 'rgba(79,70,229,0.35)' : 'rgba(255,255,255,0.08)' }}>

      {job.isRecommended && (
        <div className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full self-start"
          style={{ background: 'rgba(79,70,229,0.15)', color: '#818CF8' }}>
          <Zap size={11} />Recommended
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-base font-bold"
          style={{ background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color:'#fff' }}>
          {job.company.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: '#E2E8F0' }}>{job.role}</p>
          <p className="text-xs" style={{ color: '#94A3B8' }}>{job.company}</p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-xl flex-shrink-0"
          style={{ background: matchBg, color: matchColor }}>
          {job.match}% match
        </span>
      </div>

      <div className="flex flex-wrap gap-2 text-xs" style={{ color: '#64748B' }}>
        <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
        <span className="px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.04)', color: '#94A3B8' }}>{job.type}</span>
        {job.salary && <span className="flex items-center gap-1"><Clock size={11}/>{job.salary}</span>}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {job.skills.slice(0, 3).map(s => (
          <span key={s} className="text-xs px-2 py-0.5 rounded-full"
            style={{ background:'rgba(79,70,229,0.12)', color:'#818CF8' }}>{s}</span>
        ))}
      </div>

      <div className="flex gap-2 mt-1">
        <button onClick={() => onApply(job)}
          className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
          style={{ background:'linear-gradient(135deg,#4F46E5,#06B6D4)', color:'#fff' }}>
          Apply Now
        </button>
        <a href={job.url} target="_blank" rel="noreferrer"
          className="px-3 py-2 rounded-xl border transition-all hover:bg-white/5"
          style={{ borderColor:'rgba(255,255,255,0.1)', color:'#94A3B8' }}>
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
