'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap, ArrowRight, GraduationCap, BookOpen } from 'lucide-react';
import { useAppStore } from '@/store';
import { authApi } from '@/lib/api';
import Cookies from 'js-cookie';

const schema = z.object({
  name:     z.string().min(2, 'Name too short'),
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
  confirm:  z.string(),
  college:  z.string().min(2, 'College name required'),
  branch:   z.string().min(1, 'Branch required'),
}).refine(d => d.password === d.confirm, { message: "Passwords don't match", path: ['confirm'] });

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const setUser = useAppStore(s => s.setUser);
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole]       = useState<'student' | 'faculty'>('student');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authApi.signup({ name: data.name, email: data.email, password: data.password, role: role.toUpperCase() });
      const payload = res.data?.data ?? res.data;
      const token = payload?.token;
      const user = {
        id: payload?.userId,
        name: payload?.name,
        email: payload?.email,
        role: payload?.role || role
      };

      Cookies.set('cip_token', token, { expires: 7, sameSite: 'strict' });
      setUser(user);
      toast.success('Account created! Redirecting to OTP verification…');
      router.push('/auth/verify');
    } catch {
      const newUser = {
        id: `u-${Date.now()}`, name: data.name, email: data.email,
        role, college: data.college, branch: data.branch, year: 2,
      };
      setUser(newUser);
      toast.success('Demo mode – account created!');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const branches = ['CSE','IT','ECE','EEE','ME','CE','MCA','MBA','Other'];

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#4F46E5,#06B6D4)' }}>
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold grad-text" style={{ fontFamily: 'Syne, sans-serif' }}>CIP</span>
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Create Account</h1>
          <p className="text-sm" style={{ color: '#A1A1AA' }}>Start your career journey today</p>
        </div>

        <div className="rounded-2xl p-6 border" style={{ background: '#0A0A0A', borderColor: 'rgba(255,255,255,0.08)' }}>
          {/* Role Toggle */}
          <div className="flex rounded-xl p-1 mb-5" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {(['student', 'faculty'] as const).map(r => (
              <button key={r} onClick={() => setRole(r)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={role === r
                  ? { background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: '#fff' }
                  : { color: '#A1A1AA' }}>
                {r === 'student' ? <GraduationCap size={14} /> : <BookOpen size={14} />}
                {r === 'student' ? 'Student' : 'Faculty'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {[
              { name: 'name' as const,    label: 'Full Name',    type: 'text',  placeholder: 'Aryan Sharma' },
              { name: 'email' as const,   label: 'Email',        type: 'email', placeholder: 'you@college.edu' },
              { name: 'college' as const, label: 'College/University', type: 'text', placeholder: 'RGPV University' },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#A1A1AA' }}>{f.label}</label>
                <input {...register(f.name)} type={f.type} placeholder={f.placeholder}
                  className="w-full px-4 py-3 rounded-xl text-sm border transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#FFFFFF' }} />
                {errors[f.name] && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors[f.name]?.message}</p>}
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#A1A1AA' }}>Branch</label>
              <select {...register('branch')}
                className="w-full px-4 py-3 rounded-xl text-sm border transition-all appearance-none"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#FFFFFF' }}>
                <option value="" className="bg-[#0A0A0A] text-white">Select branch</option>
                {branches.map(b => <option key={b} value={b} className="bg-[#0A0A0A] text-white">{b}</option>)}
              </select>
              {errors.branch && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.branch.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#A1A1AA' }}>Password</label>
              <div className="relative">
                <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters"
                  className="w-full px-4 py-3 rounded-xl text-sm border transition-all pr-11"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#FFFFFF' }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100">
                  {showPw ? <EyeOff size={15} style={{ color: '#A1A1AA' }} /> : <Eye size={15} style={{ color: '#A1A1AA' }} />}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#A1A1AA' }}>Confirm Password</label>
              <input {...register('confirm')} type="password" placeholder="Re-enter password"
                className="w-full px-4 py-3 rounded-xl text-sm border transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#FFFFFF' }} />
              {errors.confirm && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.confirm.message}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg disabled:opacity-60 mt-2"
              style={{ background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: '#fff', boxShadow: '0 4px 15px rgba(79,70,229,0.4)' }}>
              {loading
                ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <>Create Account <ArrowRight size={15} /></>}
            </button>
          </form>

          <p className="mt-4 text-center text-sm" style={{ color: '#71717A' }}>
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium hover:underline" style={{ color: '#818CF8' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
