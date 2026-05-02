'use client';
// app/dashboard/certificates/page.tsx

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserCertificates, getStatusColor, getScoreColor, CertificateSummary } from '@/lib/api/certificates';

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
          <p className="text-gray-500 text-sm mt-1">{total} certificate{total !== 1 ? 's' : ''} verified</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/certificates/upload')}
          className="bg-blue-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm text-sm"
        >
          + Verify New
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border">
          <div className="text-5xl mb-4">📜</div>
          <h3 className="text-lg font-semibold text-gray-700">No certificates yet</h3>
          <p className="text-gray-400 text-sm mt-1">Upload your first certificate to get started</p>
          <button
            onClick={() => router.push('/dashboard/certificates/upload')}
            className="mt-5 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 text-sm"
          >
            Verify a Certificate
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              onClick={() => router.push(`/dashboard/certificates/${cert.id}`)}
              className="bg-white border rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all hover:border-blue-200"
            >
              {/* Score circle */}
              <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center">
                {cert.authenticityScore != null ? (
                  <div className="relative w-14 h-14">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="24" fill="none" stroke="#f1f5f9" strokeWidth="4" />
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
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold"
                      style={{ color: getScoreColor(cert.authenticityScore) }}>
                      {cert.authenticityScore}
                    </span>
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                    {cert.status === 'PROCESSING' ? '⏳' : cert.status === 'FAILED' ? '❌' : '📄'}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{cert.fileName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(cert.createdAt)}</p>
              </div>

              {/* Badges */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                {cert.authenticityStatus ? (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(cert.authenticityStatus)}`}>
                    {cert.authenticityStatus}
                  </span>
                ) : (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold
                    ${cert.status === 'PROCESSING' ? 'bg-blue-100 text-blue-700 animate-pulse'
                      : cert.status === 'FAILED' ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600'}`}>
                    {cert.status}
                  </span>
                )}
                {cert.confidenceLevel && (
                  <span className="text-xs text-gray-400">{cert.confidenceLevel} conf.</span>
                )}
              </div>

              <span className="text-gray-300 ml-1">›</span>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page + 1} of {Math.ceil(total / PAGE_SIZE)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={(page + 1) * PAGE_SIZE >= total}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
