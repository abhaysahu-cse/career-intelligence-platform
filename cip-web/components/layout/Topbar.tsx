'use client';
import { usePathname } from 'next/navigation';
import { Bell, Search, Menu, Flame } from 'lucide-react';
import { useAppStore } from '@/store';
import { useState } from 'react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/profile':   'My Profile',
  '/analytics': 'Progress Tracking',
  '/interview': 'AI Interview Coach',
  '/jobs':      'Jobs & Internships',
  '/dashboard/certificates': 'Certificates',
  '/roadmap':   'Learning Roadmap',
  '/admin':     'Faculty Dashboard',
  '/settings':  'Settings',
};

export default function Topbar() {
  const pathname      = usePathname();
  const { user, sidebarOpen, setSidebarOpen, score } = useAppStore();
  const [showSearch, setShowSearch] = useState(false);
  const [notifOpen, setNotifOpen]   = useState(false);

  const title = Object.entries(pageTitles).find(([key]) =>
    pathname === key || pathname.startsWith(key + '/')
  )?.[1] ?? 'CIP';

  // Interview streak (persisted via localStorage)
  const getStreak = () => {
    if (typeof window === 'undefined') return 0;
    const data = localStorage.getItem('cip_streak');
    if (!data) return 0;
    try {
      const { count, lastDate } = JSON.parse(data);
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (lastDate === today || lastDate === yesterday) return count;
      return 0;
    } catch { return 0; }
  };
  const streak = getStreak();

  // Smart notifications based on real state
  const notifications: Array<{ id: number; text: string; time: string; unread: boolean }> = [];
  if (score) {
    if (score.readiness >= 65) {
      notifications.push({ id: 1, text: '🎉 You are Ready to Apply! Check recommended jobs.', time: 'Now', unread: true });
    } else {
      notifications.push({ id: 1, text: `📈 Readiness at ${score.readiness}/100. ${Math.max(7, Math.round((65 - score.readiness) / 0.3))} days to ready.`, time: 'Today', unread: true });
    }
    if ((score.interviewScore ?? 0) < 50) {
      notifications.push({ id: 2, text: '🎤 Interview score is low. Practice to improve.', time: 'Suggestion', unread: true });
    }
    if ((score.resumeScore ?? 0) < 60) {
      notifications.push({ id: 3, text: '📄 Resume needs updating for better matching.', time: 'Suggestion', unread: true });
    }
  }
  if (streak >= 3) {
    notifications.push({ id: 4, text: `🔥 ${streak}-day interview streak! Keep it going!`, time: 'Streak', unread: true });
  }

  return (
    <header className="fixed top-0 right-0 z-30 flex items-center gap-3 px-4 md:px-6 h-16 border-b transition-all duration-300 backdrop-blur-xl bg-white/5"
      style={{
        left: sidebarOpen ? '240px' : '72px',
        borderColor: 'rgba(255,255,255,0.06)',
      }}>

      {/* Mobile sidebar toggle */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)}
        className="p-2 rounded-lg transition-colors hover:bg-white/5 md:hidden"
        style={{ color: '#A1A1AA' }}>
        <Menu size={18} />
      </button>

      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-base font-semibold" style={{ fontFamily: 'Syne, sans-serif', color: '#FFFFFF' }}>
          {title}
        </h1>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2">
        {showSearch ? (
          <input autoFocus onBlur={() => setShowSearch(false)}
            placeholder="Search anything…"
            className="w-48 px-3 py-1.5 rounded-lg text-sm border transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(79,70,229,0.4)', color: '#FFFFFF' }} />
        ) : (
          <button onClick={() => setShowSearch(true)}
            className="p-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: '#A1A1AA' }}>
            <Search size={16} />
          </button>
        )}
      </div>

      {/* Interview Streak */}
      {streak > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <Flame size={14} style={{ color: '#F59E0B' }} />
          <span className="text-xs font-bold" style={{ color: '#FCD34D' }}>{streak}</span>
        </div>
      )}

      {/* Notifications */}
      <div className="relative">
        <button onClick={() => setNotifOpen(!notifOpen)}
          className="relative p-2 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: '#A1A1AA' }}>
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: '#EF4444', boxShadow: '0 0 6px rgba(239,68,68,0.8)' }} />
        </button>

        {notifOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border shadow-xl z-50 overflow-hidden"
              style={{ background: '#0A0A0A', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="px-4 py-3 border-b flex items-center justify-between"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <span className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>Notifications</span>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(79,70,229,0.2)', color: '#818CF8' }}>
                  {notifications.filter(n => n.unread).length} new
                </span>
              </div>
              <div className="divide-y">
                {notifications.length ? notifications.map(n => (
                  <div key={n.id} className="px-4 py-3 hover:bg-white/3 cursor-pointer transition-colors">
                    <div className="flex gap-2 items-start">
                      {n.unread && <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#4F46E5' }} />}
                      <div className={n.unread ? '' : 'ml-3.5'}>
                        <p className="text-xs mb-0.5" style={{ color: n.unread ? '#FFFFFF' : '#A1A1AA' }}>{n.text}</p>
                        <p className="text-xs" style={{ color: '#71717A' }}>{n.time}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="px-4 py-6 text-sm" style={{ color: '#A1A1AA' }}>
                    No live notifications yet.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer"
        style={{ background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: '#fff' }}>
        {user?.name?.charAt(0).toUpperCase() ?? 'U'}
      </div>
    </header>
  );
}
