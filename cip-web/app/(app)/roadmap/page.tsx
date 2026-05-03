'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp,
  BookOpen, FolderOpen, Video, Briefcase,
  ExternalLink, Trophy, Zap, AlertTriangle
} from 'lucide-react';
import { roadmapApi, analyticsApi } from '@/lib/api';
import { useAppStore } from '@/store';
import type { RoadmapTask, Analytics } from '@/types';

const categoryConfig = {
  skill:     { icon: BookOpen,    color: '#818CF8', bg: 'rgba(79,70,229,0.15)',  label: 'Skill' },
  project:   { icon: FolderOpen,  color: '#67E8F9', bg: 'rgba(6,182,212,0.15)', label: 'Project' },
  interview: { icon: Video,       color: '#4ADE80', bg: 'rgba(34,197,94,0.15)', label: 'Interview' },
  apply:     { icon: Briefcase,   color: '#FCD34D', bg: 'rgba(245,158,11,0.15)',label: 'Apply' },
} as const;

const unwrapPayload = <T,>(response: { data: T } | { data: { data: T } }) =>
  'data' in (response.data as Record<string, unknown>)
    ? (response.data as { data: T }).data
    : (response.data as T);

export default function RoadmapPage() {
  const qc = useQueryClient();
  const score = useAppStore(s => s.score);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1, 2]));

  const { data: tasks } = useQuery({
    queryKey: ['roadmap'],
    queryFn: async () => {
      try { 
        const payload: any = unwrapPayload(await roadmapApi.get());
        if (Array.isArray(payload)) return payload as RoadmapTask[];
        if (payload && typeof payload === 'object' && 'phases' in payload) {
          return payload.phases.map((p: any) => ({
             id: `phase-${p.phase}`,
             week: p.phase,
             task: p.title,
             description: `Topics: ${p.topics?.join(', ')}`,
             completed: p.completed ?? false,
             category: p.title.toLowerCase().includes('interview') ? 'interview' : 'skill',
             resources: payload.resources?.slice(0, 2) ?? []
          })) as RoadmapTask[];
        }
        return [];
      }
      catch (error) { 
        console.error('Failed to fetch roadmap:', error);
        return []; 
      }
    },
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => (await analyticsApi.get()).data,
  });
  const analytics = analyticsData ? unwrapPayload(analyticsData) as Analytics : null;

  // Weakness → study plan mapping
  const weaknessPlan: Record<string, { tasks: string[]; resources: { title: string; url: string }[] }> = {
    'time complexity': {
      tasks: ['Review Big-O notation fundamentals', 'Analyze complexity of 10 common algorithms', 'Practice explaining complexity in mock interviews'],
      resources: [{ title: 'Big-O Cheat Sheet', url: 'https://www.bigocheatsheet.com/' }],
    },
    'edge cases': {
      tasks: ['Always check null/empty inputs first', 'Practice boundary value analysis', 'Solve 5 problems focusing on edge cases'],
      resources: [{ title: 'LeetCode Edge Cases', url: 'https://leetcode.com/explore/' }],
    },
    'system design': {
      tasks: ['Study URL shortener design pattern', 'Practice drawing system diagrams', 'Take an AI interview focused on System Design'],
      resources: [{ title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }],
    },
    'database': {
      tasks: ['Review indexing & query optimization', 'Practice SQL joins and subqueries', 'Study database normalization'],
      resources: [{ title: 'SQL Practice', url: 'https://www.hackerrank.com/domains/sql' }],
    },
    'communication': {
      tasks: ['Use STAR method for behavioral questions', 'Practice structured answers: First → Then → Finally', 'Record yourself answering 3 questions'],
      resources: [{ title: 'STAR Method Guide', url: 'https://www.themuse.com/advice/star-interview-method' }],
    },
    'dsa': {
      tasks: ['Solve 5 Binary Tree problems (Easy → Medium)', 'Implement BFS and DFS from scratch', 'Study tree traversal patterns'],
      resources: [{ title: 'NeetCode 150', url: 'https://neetcode.io/practice' }],
    },
    'oop': {
      tasks: ['Review SOLID principles', 'Implement 3 design patterns', 'Practice explaining polymorphism and inheritance'],
      resources: [{ title: 'Refactoring Guru', url: 'https://refactoring.guru/design-patterns' }],
    },
  };

  const completeMutation = useMutation({
    mutationFn: async (taskId: string) => {
      try { await roadmapApi.completeTask(taskId); } catch {}
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roadmap'] });
    },
  });

  const allTasks  = tasks ?? [];
  const completed = allTasks.filter(t => t.completed).length;
  const total     = allTasks.length;
  const pct       = total > 0 ? Math.round(completed / total * 100) : 0;

  const weeks = Array.from(new Set(allTasks.map(t => t.week))).sort((a, b) => a - b);

  const toggleWeek = (w: number) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      next.has(w) ? next.delete(w) : next.add(w);
      return next;
    });
  };

  const handleToggle = (task: RoadmapTask) => {
    if (task.completed) return;
    completeMutation.mutate(task.id);
    // optimistic
    const updated = allTasks.map(t => t.id === task.id ? { ...t, completed: true } : t);
    qc.setQueryData(['roadmap'], updated);
    toast.success(`"${task.task}" completed! 🎉`);
  };

  return (
    <div className="space-y-6 pb-8 max-w-3xl">
      {/* Progress overview */}
      <div className="rounded-3xl p-6 border relative overflow-hidden"
        style={{ background:'linear-gradient(135deg,rgba(79,70,229,0.15),rgba(6,182,212,0.08))', borderColor:'rgba(79,70,229,0.25)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 opacity-10 pointer-events-none rounded-full"
          style={{ background:'radial-gradient(circle,#06B6D4,transparent 70%)', transform:'translate(30%,-30%)' }} />
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={18} style={{ color:'#FCD34D' }} />
              <h2 className="text-lg font-bold" style={{ fontFamily:'Syne,sans-serif', color:'#E2E8F0' }}>
                Learning Roadmap
              </h2>
            </div>
            <p className="text-sm mb-4" style={{ color:'#94A3B8' }}>
              Your personalized path from preparation to placement
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.1)' }}>
                <div className="h-full rounded-full progress-animate"
                  style={{ width:`${pct}%`, background:'linear-gradient(90deg,#4F46E5,#06B6D4)' }} />
              </div>
              <span className="text-sm font-mono font-bold whitespace-nowrap" style={{ color:'#E2E8F0' }}>
                {completed}/{total}
              </span>
            </div>
          </div>
          <div className="text-center flex-shrink-0">
            <p className="text-4xl font-bold grad-text" style={{ fontFamily:'JetBrains Mono,monospace' }}>{pct}%</p>
            <p className="text-xs" style={{ color:'#94A3B8' }}>Complete</p>
          </div>
        </div>

        {/* Category stats */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {Object.entries(categoryConfig).map(([cat, cfg]) => {
            const catTasks = allTasks.filter(t => t.category === cat);
            const done     = catTasks.filter(t => t.completed).length;
            return (
              <div key={cat} className="text-center p-2 rounded-xl"
                style={{ background:'rgba(255,255,255,0.04)' }}>
                <cfg.icon size={14} className="mx-auto mb-1" style={{ color: cfg.color }} />
                <p className="text-xs font-mono font-bold" style={{ color:'#E2E8F0' }}>{done}/{catTasks.length}</p>
                <p className="text-xs" style={{ color:'#64748B' }}>{cfg.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI-Detected Gaps → Dynamic Study Plan */}
      {analytics && analytics.weakSkills.length > 0 && (
        <div className="rounded-2xl border p-5" style={{ background: '#1E293B', borderColor: 'rgba(245,158,11,0.2)' }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} style={{ color: '#F59E0B' }} />
            <h3 className="font-semibold text-sm" style={{ fontFamily: 'Syne,sans-serif', color: '#E2E8F0' }}>
              AI-Detected Gaps → Study Plan
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.12)', color: '#FCD34D' }}>
              Based on your interviews
            </span>
          </div>
          <div className="space-y-4">
            {analytics.weakSkills.slice(0, 3).map((skill, idx) => {
              const plan = weaknessPlan[skill.toLowerCase()] ?? {
                tasks: ['Practice this topic in your next interview session', 'Review fundamentals and core concepts'],
                resources: [],
              };
              const priority = idx === 0 ? 'HIGH' : idx === 1 ? 'MEDIUM' : 'LOW';
              const prColor = priority === 'HIGH' ? '#EF4444' : priority === 'MEDIUM' ? '#F59E0B' : '#06B6D4';
              const prBg = priority === 'HIGH' ? 'rgba(239,68,68,0.06)' : priority === 'MEDIUM' ? 'rgba(245,158,11,0.05)' : 'rgba(6,182,212,0.05)';
              return (
                <div key={skill} className="rounded-xl border p-4" style={{ borderColor: `${prColor}22`, background: prBg }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: `${prColor}22`, color: prColor, border: `1px solid ${prColor}33` }}>
                      {priority}
                    </span>
                    <span className="text-sm font-semibold capitalize" style={{ color: '#E2E8F0' }}>{skill}</span>
                  </div>
                  <div className="space-y-1.5 ml-1">
                    {plan.tasks.map(task => (
                      <div key={task} className="flex items-start gap-2">
                        <Circle size={12} className="flex-shrink-0 mt-0.5" style={{ color: prColor }} />
                        <span className="text-xs" style={{ color: '#94A3B8' }}>{task}</span>
                      </div>
                    ))}
                  </div>
                  {plan.resources.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {plan.resources.map(res => (
                        <a key={res.url} href={res.url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-xs hover:underline"
                          style={{ color: '#818CF8' }}>
                          <ExternalLink size={10} />{res.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week-wise timeline */}
      <div className="space-y-3">
        {weeks.map(week => {
          const weekTasks = allTasks.filter(t => t.week === week);
          const weekDone  = weekTasks.filter(t => t.completed).length;
          const expanded  = expandedWeeks.has(week);
          const allDone   = weekDone === weekTasks.length;

          return (
            <div key={week} className="rounded-2xl border overflow-hidden"
              style={{ background:'#1E293B', borderColor: allDone ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)' }}>
              {/* Week header */}
              <button onClick={() => toggleWeek(week)}
                className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/3"
                style={{ textAlign:'left' }}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0`}
                    style={allDone
                      ? { background:'rgba(34,197,94,0.2)', color:'#4ADE80' }
                      : { background:'rgba(79,70,229,0.2)', color:'#818CF8' }}>
                    {allDone ? <CheckCircle2 size={16} /> : week}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color:'#E2E8F0' }}>Week {week}</p>
                    <p className="text-xs" style={{ color:'#64748B' }}>{weekDone}/{weekTasks.length} tasks done</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-24 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full"
                      style={{ width:`${weekDone/weekTasks.length*100}%`, background:'linear-gradient(90deg,#4F46E5,#22C55E)' }} />
                  </div>
                  {expanded ? <ChevronUp size={16} style={{ color:'#64748B' }} /> : <ChevronDown size={16} style={{ color:'#64748B' }} />}
                </div>
              </button>

              {/* Tasks */}
              {expanded && (
                <div className="border-t px-4 pb-4 pt-3 space-y-2"
                  style={{ borderColor:'rgba(255,255,255,0.06)' }}>
                  {weekTasks.map(task => {
                    const cfg = categoryConfig[task.category];
                    return (
                      <div key={task.id}
                        className="flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:border-opacity-50"
                        style={{
                          background: task.completed ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)',
                          borderColor: task.completed ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)',
                        }}
                        onClick={() => handleToggle(task)}>
                        {/* Checkbox */}
                        <div className="flex-shrink-0 mt-0.5">
                          {task.completed
                            ? <CheckCircle2 size={18} style={{ color:'#22C55E' }} />
                            : <Circle size={18} style={{ color:'#4F46E5' }} />
                          }
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-medium ${task.completed ? 'line-through' : ''}`}
                              style={{ color: task.completed ? '#64748B' : '#E2E8F0' }}>
                              {task.task}
                            </p>
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: cfg.bg, color: cfg.color }}>
                              <cfg.icon size={10} />
                              {cfg.label}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-xs mt-0.5" style={{ color:'#64748B' }}>{task.description}</p>
                          )}
                          {task.resources && task.resources.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {task.resources.map(res => (
                                <a key={res.url} href={res.url} target="_blank" rel="noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="flex items-center gap-1 text-xs hover:underline"
                                  style={{ color:'#818CF8' }}>
                                  <ExternalLink size={10} />{res.title}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion nudge */}
      {pct < 100 && (
        <div className="rounded-2xl p-4 border flex items-start gap-3"
          style={{ background:'rgba(79,70,229,0.08)', borderColor:'rgba(79,70,229,0.2)' }}>
          <Zap size={16} className="flex-shrink-0 mt-0.5" style={{ color:'#818CF8' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color:'#E2E8F0' }}>
              {total - completed} tasks remaining
            </p>
            <p className="text-xs" style={{ color:'#94A3B8' }}>
              Completing your roadmap can boost your readiness score by up to 25 points.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
