'use client';
import { MapPin, Clock, ExternalLink, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { Job } from '@/types';

interface Props {
  job: Job;
  onApply: (job: Job) => void;
}

export default function JobCard({ job, onApply }: Props) {
  const matchColor = job.match >= 80 ? '#22C55E' : job.match >= 60 ? '#F59E0B' : '#EF4444';
  const matchBg    = job.match >= 80 ? 'rgba(34,197,94,0.12)' : job.match >= 60 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';

  // Split skills into matched (first 3-4 from job) vs missing (rest)
  const matchedSkills = job.matchedSkills ?? job.skills.slice(0, Math.ceil(job.skills.length * (job.match / 100)));
  const missingSkills = job.missingSkills ?? job.skills.filter(s => !matchedSkills.includes(s));

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

      {/* Why This Job Matches — Intelligence Layer */}
      {job.isRecommended && (
        <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '3px solid rgba(79,70,229,0.5)' }}>
          <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>Why this job fits you</p>
          {matchedSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {matchedSkills.slice(0, 4).map(s => (
                <span key={s} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(34,197,94,0.1)', color: '#4ADE80' }}>
                  <CheckCircle2 size={9} />{s}
                </span>
              ))}
            </div>
          )}
          {missingSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.slice(0, 3).map(s => (
                <span key={s} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(245,158,11,0.08)', color: '#FBBF24' }}>
                  <AlertTriangle size={9} />Improve: {s}
                </span>
              ))}
            </div>
          )}
          {job.matchReason && (
            <p className="text-xs" style={{ color: '#64748B' }}>{job.matchReason}</p>
          )}
          {missingSkills.length > 0 && job.match < 95 && (
            <div className="rounded-lg px-2.5 py-1.5 mt-1" style={{ background: 'rgba(79,70,229,0.08)', borderLeft: '2px solid rgba(79,70,229,0.4)' }}>
              <p className="text-xs font-medium" style={{ color: '#A5B4FC' }}>
                📈 Learn {missingSkills.slice(0, 2).join(' & ')} to increase match from {job.match}% → {Math.min(95, job.match + missingSkills.length * 8)}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Skills chips for non-recommended */}
      {!job.isRecommended && (
        <div className="flex flex-wrap gap-1.5">
          {job.skills.slice(0, 3).map(s => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full"
              style={{ background:'rgba(79,70,229,0.12)', color:'#818CF8' }}>{s}</span>
          ))}
        </div>
      )}

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
