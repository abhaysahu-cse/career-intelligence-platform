'use client';
// components/certificates/CertificateHistory.tsx
// Embeddable widget for showing recent certificates in any page (e.g. profile, dashboard)

import React, { useEffect, useState } from 'react';
import { getUserCertificates, getScoreColor, CertificateSummary } from '@/lib/api/certificates';
import { ChevronRight } from 'lucide-react';

interface CertificateHistoryProps {
  userId: number;
  maxItems?: number;
  onViewAll?: () => void;
  onSelectCertificate?: (id: number) => void;
}

export default function CertificateHistory({
  userId,
  maxItems = 5,
  onViewAll,
  onSelectCertificate,
}: CertificateHistoryProps) {
  const [certs, setCerts] = useState<CertificateSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserCertificates(userId, 0, maxItems)
      .then((d) => { setCerts(d.certificates); setTotal(d.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId, maxItems]);

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'genuine': return { bg: 'rgba(34,197,94,0.12)', color: '#4ADE80' };
      case 'likely genuine': return { bg: 'rgba(132,204,22,0.12)', color: '#A3E635' };
      case 'suspicious': return { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24' };
      case 'likely fake': return { bg: 'rgba(249,115,22,0.12)', color: '#FB923C' };
      case 'fake': return { bg: 'rgba(239,68,68,0.12)', color: '#FCA5A5' };
      default: return { bg: 'rgba(255,255,255,0.06)', color: '#94A3B8' };
    }
  };

  if (loading) return (
    <div className="space-y-2">
      {[1, 2].map(i => <div key={i} className="rounded-xl h-14 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
    </div>
  );

  if (certs.length === 0) return (
    <div className="text-center py-6 text-sm" style={{ color: '#64748B' }}>
      No certificates verified yet
    </div>
  );

  return (
    <div>
      <div className="space-y-2">
        {certs.map((cert) => {
          const sts = getStatusStyle(cert.authenticityStatus ?? '');
          return (
            <div
              key={cert.id}
              onClick={() => onSelectCertificate?.(cert.id)}
              className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all card-hover-glow"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              {/* Mini score */}
              {cert.authenticityScore != null ? (
                <span className="text-sm font-bold font-mono w-9 text-center" style={{ color: getScoreColor(cert.authenticityScore) }}>
                  {cert.authenticityScore}
                </span>
              ) : (
                <span className="text-sm w-9 text-center" style={{ color: '#4B5563' }}>—</span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#E2E8F0' }}>{cert.fileName}</p>
              </div>
              {cert.authenticityStatus && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: sts.bg, color: sts.color }}>
                  {cert.authenticityStatus}
                </span>
              )}
              {!cert.authenticityStatus && (
                <span className="text-xs" style={{ color: '#64748B' }}>{cert.status}</span>
              )}
              <ChevronRight size={14} style={{ color: '#4B5563' }} />
            </div>
          );
        })}
      </div>
      {total > maxItems && onViewAll && (
        <button
          onClick={onViewAll}
          className="mt-3 w-full text-xs font-medium hover:underline"
          style={{ color: '#818CF8' }}
        >
          View all {total} certificates →
        </button>
      )}
    </div>
  );
}
