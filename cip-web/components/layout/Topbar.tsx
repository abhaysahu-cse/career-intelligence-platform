'use client';
import { usePathname } from 'next/navigation';
import { Bell, Search, Menu } from 'lucide-react';
import { useAppStore } from '@/store';
import { useState } from 'react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/profile':   'My Profile',
  '/analytics': 'Progress Tracking',
  '/interview': 'AI Interview Coach',
  '/jobs':      'Jobs & Internships',
  '/roadmap':   'Learning Roadmap',
  '/admin':     'Faculty Dashboard',
  '/settings':  'Settings',
};

export default function Topbar() {
  const pathname      = usePathname();
  const { user, sidebarOpen, setSidebarOpen } = useAppStore();
  const [showSearch, setShowSearch] = useState(false);
  const [notifOpen, setNotifOpen]   = useState(false);

  const title = Object.entries(pageTitles).find(([key]) =>
    pathname === key || pathname.startsWith(key + '/')
  )?.[1] ?? 'CIP';

  const notifications: Array<{ id: number; text: string; time: string; unread: boolean }> = [];

  return (
    <header className="fixed top-0 right-0 z-30 flex items-center gap-3 px-4 md:px-6 h-16 border-b transition-all duration-300"
      style={{
        left: sidebarOpen ? '240px' : '72px',
        background: 'rgba(15,23,42,0.8)',
        backdropFilter: 'blur(12px)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}>

      {/* Mobile sidebar toggle */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)}
        className="p-2 rounded-lg transition-colors hover:bg-white/5 md:hidden"
        style={{ color: '#94A3B8' }}>
        <Menu size={18} />
      </button>

      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-base font-semibold" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E8F0' }}>
          {title}
        </h1>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2">
        {showSearch ? (
          <input autoFocus onBlur={() => setShowSearch(false)}
            placeholder="Search anything…"
            className="w-48 px-3 py-1.5 rounded-lg text-sm border transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(79,70,229,0.4)', color: '#E2E8F0' }} />
        ) : (
          <button onClick={() => setShowSearch(true)}
            className="p-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: '#94A3B8' }}>
            <Search size={16} />
          </button>
        )}
      </div>

      {/* Notifications */}
      <div className="relative">
        <button onClick={() => setNotifOpen(!notifOpen)}
          className="relative p-2 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: '#94A3B8' }}>
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: '#EF4444', boxShadow: '0 0 6px rgba(239,68,68,0.8)' }} />
        </button>

        {notifOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border shadow-xl z-50 overflow-hidden"
              style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="px-4 py-3 border-b flex items-center justify-between"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <span className="text-sm font-semibold" style={{ color: '#E2E8F0' }}>Notifications</span>
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
                        <p className="text-xs mb-0.5" style={{ color: n.unread ? '#E2E8F0' : '#94A3B8' }}>{n.text}</p>
                        <p className="text-xs" style={{ color: '#64748B' }}>{n.time}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="px-4 py-6 text-sm" style={{ color: '#94A3B8' }}>
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
