'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, User, LineChart, Video, Briefcase,
  Map, Users, Zap, ChevronLeft, LogOut, Settings, ShieldCheck
} from 'lucide-react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import { authApi } from '@/lib/api';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const studentNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard'  },
  { href: '/profile',   icon: User,            label: 'Profile'    },
  { href: '/analytics', icon: LineChart,       label: 'Progress'   },
  { href: '/interview', icon: Video,            label: 'Interview'  },
  { href: '/jobs',      icon: Briefcase,        label: 'Jobs'       },
  { href: '/dashboard/certificates', icon: ShieldCheck, label: 'Certificates' },
  { href: '/roadmap',   icon: Map,              label: 'Roadmap'    },
];

const facultyExtra = [
  { href: '/admin', icon: Users, label: 'Faculty Dashboard' },
];

export default function Sidebar() {
  const pathname    = usePathname();
  const router      = useRouter();
  const { user, sidebarOpen, setSidebarOpen, setUser, score } = useAppStore();
  const isFaculty   = user?.role === 'faculty';
  const navItems    = isFaculty ? [...facultyExtra, ...studentNav] : studentNav;

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    Cookies.remove('cip_token');
    setUser(null);
    toast.success('Logged out');
    router.push('/auth/login');
  };

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300 border-r backdrop-blur-xl bg-slate-900/80',
        'sidebar-transition'
      )}
      style={{
        width: sidebarOpen ? '240px' : '72px',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', minHeight: '64px' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#4F46E5,#06B6D4)' }}>
          <Zap size={18} className="text-white" />
        </div>
        {sidebarOpen && (
          <span className="text-base font-bold grad-text whitespace-nowrap overflow-hidden"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            CIP
          </span>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="ml-auto p-1 rounded-lg transition-all hover:bg-white/5"
          style={{ color: '#64748B' }}
        >
          <ChevronLeft size={16} className={cn('transition-transform', !sidebarOpen && 'rotate-180')} />
        </button>
      </div>

      {/* Score mini-badge */}
      {sidebarOpen && score && (
        <div className="mx-3 mt-3 p-3 rounded-xl border"
          style={{ background: 'rgba(79,70,229,0.1)', borderColor: 'rgba(79,70,229,0.2)' }}>
          <p className="text-xs mb-1" style={{ color: '#94A3B8' }}>Readiness Score</p>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold font-mono grad-text">{score.readiness}</span>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(79,70,229,0.2)', color: '#818CF8' }}>
              {score.level}
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full progress-animate"
              style={{ width: `${score.readiness}%`, background: 'linear-gradient(90deg,#4F46E5,#06B6D4)' }} />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                active
                  ? 'text-white'
                  : 'hover:bg-white/5'
              )}
              style={active ? {
                background: 'linear-gradient(135deg, rgba(79,70,229,0.3), rgba(6,182,212,0.15))',
                color: '#E2E8F0',
              } : { color: '#64748B' }}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                  style={{ background: 'linear-gradient(135deg,#4F46E5,#06B6D4)' }} />
              )}
              <item.icon size={18} className="flex-shrink-0" style={active ? { color: '#818CF8' } : {}} />
              {sidebarOpen && (
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              )}
              {/* Tooltip when collapsed */}
              {!sidebarOpen && (
                <div className="absolute left-full ml-2 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
                  style={{ background: '#1E293B', color: '#E2E8F0', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t space-y-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <Link href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/5"
          style={{ color: '#64748B' }}>
          <Settings size={18} className="flex-shrink-0" />
          {sidebarOpen && <span className="text-sm font-medium">Settings</span>}
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-red-500/10"
          style={{ color: '#64748B' }}>
          <LogOut size={18} className="flex-shrink-0" />
          {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
        </button>

        {/* User info */}
        {sidebarOpen && user && (
          <div className="flex items-center gap-2 px-3 py-2 mt-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: '#fff' }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium truncate" style={{ color: '#E2E8F0' }}>{user.name}</p>
              <p className="text-xs truncate" style={{ color: '#64748B' }}>{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
