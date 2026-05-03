'use client';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Search, Download, Users, AlertTriangle, TrendingUp,
  ChevronUp, ChevronDown, Filter
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { adminApi } from '@/lib/api';
import { getRiskColor, getRiskBg } from '@/lib/utils';
import type { StudentRecord, RiskLevel } from '@/types';

type SortKey = keyof StudentRecord;

export default function AdminPage() {
  const [search, setSearch]     = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL');
  const [sortKey, setSortKey]   = useState<SortKey>('readiness');
  const [sortDir, setSortDir]   = useState<'asc'|'desc'>('desc');

  const { data: students } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => {
      try { return (await adminApi.getStudents()).data as StudentRecord[]; }
      catch (error) { 
        console.error('Failed to fetch students:', error);
        return []; 
      }
    },
  });

  const all = students ?? [];

  const filtered = useMemo(() => {
    let list = [...all];
    if (riskFilter !== 'ALL') list = list.filter(s => s.risk === riskFilter);
    if (search) list = list.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
    );
    list.sort((a, b) => {
      const av = a[sortKey] as number | string;
      const bv = b[sortKey] as number | string;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [all, riskFilter, search, sortKey, sortDir]);

  const stats = useMemo(() => ({
    total:   all.length,
    high:    all.filter(s => s.risk === 'HIGH').length,
    medium:  all.filter(s => s.risk === 'MEDIUM').length,
    low:     all.filter(s => s.risk === 'LOW').length,
    avgScore: Math.round(all.reduce((sum, s) => sum + s.readiness, 0) / all.length),
  }), [all]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const handleExport = async () => {
    try { await adminApi.exportCsv(); } catch {}
    // Demo CSV download
    const csv = ['Name,Email,Branch,Year,CGPA,Readiness,Risk',
      ...filtered.map(s => `${s.name},${s.email},${s.branch},${s.year},${s.cgpa},${s.readiness},${s.risk}`)
    ].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'students-report.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported!');
  };

  const pieData = [
    { name:'Low Risk',    value: stats.low,    color:'#22C55E' },
    { name:'Medium Risk', value: stats.medium,  color:'#F59E0B' },
    { name:'High Risk',   value: stats.high,    color:'#EF4444' },
  ];

  const branchData = useMemo(() => {
    const map: Record<string,number[]> = {};
    all.forEach(s => {
      if (!map[s.branch]) map[s.branch] = [];
      map[s.branch].push(s.readiness);
    });
    return Object.entries(map).map(([branch, scores]) => ({
      branch,
      avg: Math.round(scores.reduce((a,b)=>a+b,0)/scores.length),
    }));
  }, [all]);

  const SortIcon = ({ col }: { col: SortKey }) => (
    sortKey === col
      ? sortDir === 'desc' ? <ChevronDown size={12}/> : <ChevronUp size={12}/>
      : <ChevronDown size={12} className="opacity-30"/>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label:'Total Students',  value: stats.total,   color:'#818CF8', bg:'rgba(79,70,229,0.15)',  icon: Users },
          { label:'High Risk',       value: stats.high,    color:'#FCA5A5', bg:'rgba(239,68,68,0.15)',  icon: AlertTriangle },
          { label:'Medium Risk',     value: stats.medium,  color:'#FCD34D', bg:'rgba(245,158,11,0.15)', icon: AlertTriangle },
          { label:'Low Risk',        value: stats.low,     color:'#4ADE80', bg:'rgba(34,197,94,0.15)',  icon: TrendingUp },
          { label:'Avg Readiness',   value: `${stats.avgScore}%`, color:'#67E8F9', bg:'rgba(6,182,212,0.15)',  icon: TrendingUp },
        ].map(c => (
          <div key={c.label} className="rounded-2xl p-4 border"
            style={{ background:'#0A0A0A', borderColor:'rgba(255,255,255,0.08)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: c.bg }}>
              <c.icon size={15} style={{ color: c.color }} />
            </div>
            <p className="text-xs" style={{ color:'#A1A1AA' }}>{c.label}</p>
            <p className="text-2xl font-bold" style={{ fontFamily:'Syne,sans-serif', color:'#FFFFFF' }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-5 border" style={{ background:'#0A0A0A', borderColor:'rgba(255,255,255,0.08)' }}>
          <h3 className="font-semibold mb-4" style={{ fontFamily:'Syne,sans-serif', color:'#FFFFFF' }}>
            Avg Readiness by Branch
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={branchData} margin={{ top:5, right:5, bottom:0, left:-20 }}>
              <defs>
                <linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5"/>
                  <stop offset="100%" stopColor="#06B6D4"/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="branch" tick={{ fill:'#71717A', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0,100]} tick={{ fill:'#71717A', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', color:'#FFFFFF' }} />
              <Bar dataKey="avg" radius={[6,6,0,0]} fill="url(#bg2)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-5 border flex flex-col items-center"
          style={{ background:'#0A0A0A', borderColor:'rgba(255,255,255,0.08)' }}>
          <h3 className="font-semibold mb-4 self-start" style={{ fontFamily:'Syne,sans-serif', color:'#FFFFFF' }}>
            Risk Distribution
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" strokeWidth={0}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', color:'#FFFFFF' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            {pieData.map(p => (
              <div key={p.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                <span style={{ color:'#A1A1AA' }}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'#71717A' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border"
            style={{ background:'rgba(255,255,255,0.04)', borderColor:'rgba(255,255,255,0.08)', color:'#FFFFFF' }} />
        </div>
        <div className="flex gap-2">
          <select value={riskFilter} onChange={e => setRiskFilter(e.target.value as RiskLevel | 'ALL')}
            className="px-3 py-2.5 rounded-xl text-sm border appearance-none"
            style={{ background:'rgba(255,255,255,0.04)', borderColor:'rgba(255,255,255,0.08)', color:'#A1A1AA' }}>
            <option value="ALL">All Risks</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background:'linear-gradient(135deg,#4F46E5,#06B6D4)', color:'#fff' }}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background:'#0A0A0A', borderColor:'rgba(255,255,255,0.08)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.02)' }}>
                {[
                  { key:'name' as SortKey,         label:'Student'      },
                  { key:'branch' as SortKey,        label:'Branch'       },
                  { key:'year' as SortKey,          label:'Year'         },
                  { key:'cgpa' as SortKey,          label:'CGPA'         },
                  { key:'readiness' as SortKey,     label:'Readiness'    },
                  { key:'risk' as SortKey,          label:'Risk'         },
                  { key:'interviewScore' as SortKey,label:'Interview'    },
                  { key:'lastActive' as SortKey,    label:'Last Active'  },
                ].map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key)}
                    className="text-left py-3 px-4 text-xs font-medium cursor-pointer hover:text-white transition-colors select-none"
                    style={{ color:'#71717A' }}>
                    <span className="flex items-center gap-1">
                      {col.label} <SortIcon col={col.key} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-white/2 transition-colors"
                  style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background:'linear-gradient(135deg,#4F46E5,#06B6D4)', color:'#fff' }}>
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-xs" style={{ color:'#FFFFFF' }}>{s.name}</p>
                        <p className="text-xs" style={{ color:'#71717A' }}>{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs" style={{ color:'#A1A1AA' }}>{s.branch}</td>
                  <td className="py-3 px-4 text-xs" style={{ color:'#A1A1AA' }}>Year {s.year}</td>
                  <td className="py-3 px-4 text-xs font-mono font-bold" style={{ color:'#FFFFFF' }}>{s.cgpa.toFixed(1)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden w-16" style={{ background:'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full"
                          style={{ width:`${s.readiness}%`, background: s.readiness>=75?'#22C55E':s.readiness>=50?'#F59E0B':'#EF4444' }} />
                      </div>
                      <span className="text-xs font-mono font-bold" style={{ color:'#FFFFFF' }}>{s.readiness}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: getRiskBg(s.risk), color: getRiskColor(s.risk) }}>
                      {s.risk}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs font-mono" style={{ color: s.interviewScore && s.interviewScore >= 60 ? '#4ADE80' : '#FCA5A5' }}>
                    {s.interviewScore ?? '–'}
                  </td>
                  <td className="py-3 px-4 text-xs" style={{ color:'#71717A' }}>
                    {new Date(s.lastActive).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t text-xs" style={{ borderColor:'rgba(255,255,255,0.06)', color:'#71717A' }}>
          Showing {filtered.length} of {all.length} students
        </div>
      </div>
    </div>
  );
}
