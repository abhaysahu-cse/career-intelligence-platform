'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/store';
import Sidebar from '@/components/layout/Sidebar';
import Topbar  from '@/components/layout/Topbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router          = useRouter();
  const pathname        = usePathname();
  const { isAuthenticated, sidebarOpen } = useAppStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen" style={{ background: '#0F172A' }}>
      <Sidebar />

      {/* Main content */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? '240px' : '72px' }}
      >
        <Topbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 pt-20 max-w-[1600px] w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => useAppStore.getState().setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
