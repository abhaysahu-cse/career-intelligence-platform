'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap, ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import Cookies from 'js-cookie';
import { useAppStore } from '@/store';
import { authApi } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAppStore((state) => state.setUser);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'student' | 'faculty'>('student');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const response = await authApi.login(data);
      const payload = response.data?.data ?? response.data;
      const token = payload?.token;
      const user = {
        id: payload?.userId,
        name: payload?.name,
        email: payload?.email,
        role: payload?.role || role
      };

      if (!token || !user.id) {
        throw new Error('Invalid auth response');
      }

      Cookies.set('cip_token', token, { expires: 7, sameSite: 'strict' });
      setUser(user);
      toast.success(`Welcome back, ${user.name}!`);
      router.push(user.role?.toLowerCase() === 'faculty' ? '/admin' : '/dashboard');
    } catch {
      toast.error('Login failed. Check backend auth service or credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #06B6D4)' }}
            >
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
              <span className="grad-text">CIP</span>
            </span>
          </div>
          <h1 className="mb-1 text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Welcome back</h1>
          <p className="text-sm" style={{ color: '#94A3B8' }}>Sign in to your Career Intelligence Platform</p>
        </div>

        <div className="rounded-2xl border p-6" style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="mb-6 flex rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {(['student', 'faculty'] as const).map((currentRole) => (
              <button
                key={currentRole}
                type="button"
                onClick={() => setRole(currentRole)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all duration-200"
                style={role === currentRole
                  ? { background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: '#fff' }
                  : { color: '#94A3B8' }}
              >
                {currentRole === 'student' ? <GraduationCap size={15} /> : <BookOpen size={15} />}
                {currentRole === 'student' ? 'Student' : 'Faculty'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: '#94A3B8' }}>Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@college.edu"
                className="w-full rounded-xl border px-4 py-3 text-sm transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#E2E8F0' }}
              />
              {errors.email && <p className="mt-1 text-xs" style={{ color: '#EF4444' }}>{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: '#94A3B8' }}>Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full rounded-xl border px-4 py-3 pr-11 text-sm transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#E2E8F0' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 transition-opacity hover:opacity-100"
                >
                  {showPw ? <EyeOff size={16} style={{ color: '#94A3B8' }} /> : <Eye size={16} style={{ color: '#94A3B8' }} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs" style={{ color: '#EF4444' }}>{errors.password.message}</p>}
            </div>

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-xs hover:underline" style={{ color: '#6366F1' }}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: '#fff', boxShadow: '0 4px 15px rgba(79,70,229,0.4)' }}
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-sm" style={{ color: '#64748B' }}>Don&apos;t have an account? </span>
            <Link href="/auth/signup" className="text-sm font-medium hover:underline" style={{ color: '#818CF8' }}>
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
