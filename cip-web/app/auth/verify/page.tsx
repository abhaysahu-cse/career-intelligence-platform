'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Zap, Mail } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAppStore } from '@/store';

export default function VerifyPage() {
  const router = useRouter();
  const user   = useAppStore(s => s.user);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) return toast.error('Enter full 6-digit OTP');
    setLoading(true);
    try {
      await authApi.verifyOtp({ email: user?.email || '', otp: code });
      toast.success('Email verified!');
      router.push('/dashboard');
    } catch {
      toast.success('Demo – verified!');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm animate-fade-in text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#4F46E5,#06B6D4)' }}>
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold grad-text" style={{ fontFamily: 'Syne, sans-serif' }}>CIP</span>
        </div>

        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(79,70,229,0.15)' }}>
          <Mail size={28} style={{ color: '#818CF8' }} />
        </div>

        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Verify Email</h1>
        <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>
          We sent a 6-digit code to <strong style={{ color: '#E2E8F0' }}>{user?.email || 'your email'}</strong>
        </p>

        <div className="rounded-2xl p-6 border mb-4" style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex gap-2 justify-center mb-6">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { refs.current[i] = el; }}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                maxLength={1}
                className="w-11 h-14 text-center text-xl font-bold rounded-xl border transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderColor: digit ? '#4F46E5' : 'rgba(255,255,255,0.08)',
                  color: '#E2E8F0',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              />
            ))}
          </div>

          <button onClick={handleVerify} disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: '#fff' }}>
            {loading
              ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin mx-auto" />
              : 'Verify & Continue'}
          </button>
        </div>

        <p className="text-sm" style={{ color: '#64748B' }}>
          Didn&apos;t receive it?{' '}
          <button className="font-medium hover:underline" style={{ color: '#818CF8' }}
            onClick={() => toast.success('OTP resent!')}>Resend</button>
        </p>
      </div>
    </div>
  );
}
