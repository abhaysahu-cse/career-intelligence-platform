'use client';
// app/dashboard/certificates/page.tsx

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserCertificates, getScoreColor, CertificateSummary } from '@/lib/api/certificates';
import { Plus, ChevronRight, ShieldCheck, Clock, XCircle, FileText } from 'lucide-react';

export default function CertificatesPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<CertificateSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const PAGE_SIZE = 10;
  const userId = typeof window !== 'undefined'
    ? Number(localStorage.getItem('userId') || '1')
    : 1;

  useEffect(() => {
    load();
  }, [page]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getUserCertificates(userId, page, PAGE_SIZE);
      setCertificates(data.certificates);
      setTotal(data.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'genuine': return { bg: 'rgba(34,197,94,0.12)', color: '#4ADE80' };
      case 'likely genuine': return { bg: 'rgba(132,204,22,0.12)', color: '#A3E635' };
      case 'suspicious': return { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24' };
      case 'likely fake': return { bg: 'rgba(249,115,22,0.12)', color: '#FB923C' };
      case 'fake': return { bg: 'rgba(239,68,68,0.12)', color: '#FCA5A5' };
      default: return { bg: 'rgba(255,255,255,0.06)', color: '#A1A1AA' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne,sans-serif', color: '#FFFFFF' }}>My Certificates</h1>
          <p className="text-sm mt-1" style={{ color: '#A1A1AA' }}>{total} certificate{total !== 1 ? 's' : ''} verified</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/certificates/upload')}
          className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: '#fff' }}
        >
          <Plus size={15} /> Verify New
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-sm mb-4 flex items-start gap-2"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
          <XCircle size={16} className="flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ background: '#0A0A0A', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(79,70,229,0.12)' }}>
            <ShieldCheck size={28} style={{ color: '#818CF8' }} />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: '#FFFFFF' }}>No certificates yet</h3>
          <p className="text-sm mt-1" style={{ color: '#71717A' }}>Upload your first certificate to get started</p>
          <button
            onClick={() => router.push('/dashboard/certificates/upload')}
            className="mt-5 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: '#fff' }}
          >
            Verify a Certificate
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {certificates.map((cert) => {
            const sts = getStatusStyle(cert.authenticityStatus ?? '');
            return (
              <div
                key={cert.id}
                onClick={() => router.push(`/dashboard/certificates/${cert.id}`)}
                className="rounded-2xl border p-4 flex items-center gap-4 cursor-pointer transition-all card-hover-glow"
                style={{ background: '#0A0A0A', borderColor: 'rgba(255,255,255,0.08)' }}
              >
                {/* Score circle */}
                <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center">
                  {cert.authenticityScore != null ? (
                    <div className="relative w-14 h-14">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                        <circle
                          cx="28" cy="28" r="24"
                          fill="none"
                          stroke={getScoreColor(cert.authenticityScore)}
                          strokeWidth="4"
                          strokeDasharray={2 * Math.PI * 24}
                          strokeDashoffset={2 * Math.PI * 24 * (1 - cert.authenticityScore / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono"
                        style={{ color: getScoreColor(cert.authenticityScore) }}>
                        {cert.authenticityScore}
                      </span>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.04)' }}>
                      {cert.status === 'PROCESSING' ? <Clock size={20} style={{ color: '#818CF8' }} className="animate-pulse" /> :
                       cert.status === 'FAILED' ? <XCircle size={20} style={{ color: '#FCA5A5' }} /> :
                       <FileText size={20} style={{ color: '#71717A' }} />}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-sm" style={{ color: '#FFFFFF' }}>{cert.fileName}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#71717A' }}>{formatDate(cert.createdAt)}</p>
                </div>

                {/* Badges */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  {cert.authenticityStatus ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: sts.bg, color: sts.color }}>
                      {cert.authenticityStatus}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        background: cert.status === 'PROCESSING' ? 'rgba(79,70,229,0.12)' : cert.status === 'FAILED' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)',
                        color: cert.status === 'PROCESSING' ? '#818CF8' : cert.status === 'FAILED' ? '#FCA5A5' : '#A1A1AA',
                      }}>
                      {cert.status}
                    </span>
                  )}
                  {cert.confidenceLevel && (
                    <span className="text-xs" style={{ color: '#71717A' }}>{cert.confidenceLevel} conf.</span>
                  )}
                </div>

                <ChevronRight size={16} style={{ color: '#4B5563' }} />
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 transition-all hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#A1A1AA' }}
          >
            Previous
          </button>
          <span className="text-sm" style={{ color: '#71717A' }}>
            Page {page + 1} of {Math.ceil(total / PAGE_SIZE)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={(page + 1) * PAGE_SIZE >= total}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 transition-all hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#A1A1AA' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
