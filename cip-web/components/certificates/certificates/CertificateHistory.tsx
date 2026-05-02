'use client';
// components/certificates/CertificateHistory.tsx
// Embeddable widget for showing recent certificates in any page (e.g. profile, dashboard)

import React, { useEffect, useState } from 'react';
import { getUserCertificates, getStatusColor, getScoreColor, CertificateSummary } from '@/lib/api/certificates';

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

  if (loading) return (
    <div className="space-y-2">
      {[1, 2].map(i => <div key={i} className="bg-gray-100 rounded-xl h-14 animate-pulse" />)}
    </div>
  );

  if (certs.length === 0) return (
    <div className="text-center py-6 text-gray-400 text-sm">
      No certificates verified yet
    </div>
  );

  return (
    <div>
      <div className="space-y-2">
        {certs.map((cert) => (
          <div
            key={cert.id}
            onClick={() => onSelectCertificate?.(cert.id)}
            className="flex items-center gap-3 p-3 bg-white rounded-xl border cursor-pointer hover:bg-gray-50 hover:border-blue-200 transition-all"
          >
            {/* Mini score */}
            {cert.authenticityScore != null ? (
              <span className="text-sm font-bold w-9 text-center" style={{ color: getScoreColor(cert.authenticityScore) }}>
                {cert.authenticityScore}
              </span>
            ) : (
              <span className="text-sm w-9 text-center text-gray-300">—</span>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{cert.fileName}</p>
            </div>
            {cert.authenticityStatus && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(cert.authenticityStatus)}`}>
                {cert.authenticityStatus}
              </span>
            )}
            {!cert.authenticityStatus && (
              <span className="text-xs text-gray-400">{cert.status}</span>
            )}
          </div>
        ))}
      </div>
      {total > maxItems && onViewAll && (
        <button
          onClick={onViewAll}
          className="mt-3 w-full text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          View all {total} certificates →
        </button>
      )}
    </div>
  );
}
