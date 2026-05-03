'use client';
// app/dashboard/certificates/[id]/page.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getCertificateResult,
  getCertificate,
  getScoreColor,
  CertificateResult,
} from '@/lib/api/certificates';

const statusConfig: Record<string, { icon: string; gradient: string; border: string }> = {
  'Genuine':        { icon: '✅', gradient: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))', border: 'rgba(34,197,94,0.3)' },
  'Likely Genuine':  { icon: '✅', gradient: 'linear-gradient(135deg, rgba(132,204,22,0.15), rgba(132,204,22,0.05))', border: 'rgba(132,204,22,0.3)' },
  'Suspicious':     { icon: '⚠️', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))', border: 'rgba(245,158,11,0.3)' },
  'Likely Fake':     { icon: '⚠️', gradient: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))', border: 'rgba(249,115,22,0.3)' },
  'Fake':           { icon: '❌', gradient: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))', border: 'rgba(239,68,68,0.3)' },
};

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [result, setResult] = useState<CertificateResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    loadResult();
  }, [id]);

  const loadResult = async () => {
    setLoading(true);
    try {
      const cert = await getCertificate(id);
      if (cert.status === 'PENDING' || cert.status === 'PROCESSING') {
        setProcessing(true);
        setLoading(false);
        const timer = setInterval(async () => {
          const updated = await getCertificate(id);
          if (updated.status === 'COMPLETED') {
            clearInterval(timer);
            const r = await getCertificateResult(id);
            setResult(r);
            setProcessing(false);
          } else if (updated.status === 'FAILED') {
            clearInterval(timer);
            setError(updated.errorMessage || 'Processing failed');
            setProcessing(false);
          }
        }, 3000);
        return;
      }
      if (cert.status === 'COMPLETED') {
        const r = await getCertificateResult(id);
        setResult(r);
      } else if (cert.status === 'FAILED') {
        setError(cert.errorMessage || 'Processing failed');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load result');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-16 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4F46E5', borderTopColor: 'transparent' }} />
    </div>
  );

  if (processing) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h2 className="text-xl font-semibold mb-2" style={{ color: '#E2E8F0' }}>Analyzing Certificate</h2>
      <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>Running OCR, issuer validation, and tamper detection...</p>
      <div className="w-64 mx-auto rounded-full h-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-2 rounded-full animate-pulse w-2/3" style={{ background: 'linear-gradient(90deg, #4F46E5, #06B6D4)' }} />
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">❌</div>
      <h2 className="text-xl font-semibold mb-2" style={{ color: '#FCA5A5' }}>Processing Failed</h2>
      <p className="text-sm" style={{ color: '#94A3B8' }}>{error}</p>
      <button onClick={() => router.push('/dashboard/certificates/upload')}
        className="mt-6 px-6 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
        style={{ background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: '#fff' }}>
        Try Again
      </button>
    </div>
  );

  if (!result) return null;

  const score = result.authenticityScore ?? 0;
  const color = getScoreColor(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const cfg = statusConfig[result.status] ?? statusConfig['Suspicious'];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/dashboard/certificates')}
          className="text-sm flex items-center gap-1 hover:underline" style={{ color: '#818CF8' }}>
          ← Back
        </button>
        <h1 className="text-xl font-bold" style={{ color: '#E2E8F0' }}>{result.fileName}</h1>
      </div>

      {/* Score Hero — Big Badge */}
      <div className="rounded-3xl border p-6 flex flex-col sm:flex-row items-center gap-6"
        style={{ background: cfg.gradient, borderColor: cfg.border }}>
        <div className="relative w-36 h-36 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="10"
              strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black" style={{ color, fontFamily: 'JetBrains Mono, monospace' }}>{score}</span>
            <span className="text-xs font-medium" style={{ color: '#64748B' }}>/ 100</span>
          </div>
        </div>
        <div className="text-center sm:text-left flex-1">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-bold mb-2"
            style={{ background: `${color}22`, color }}>
            {cfg.icon} {result.status}
          </div>
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            Confidence: <span className="font-semibold" style={{ color: '#E2E8F0' }}>{result.confidenceLevel}</span>
          </p>
          <p className="text-xs mt-1" style={{ color: '#64748B' }}>
            Processed in {result.processingTimeMs ? `${(result.processingTimeMs / 1000).toFixed(1)}s` : '—'}
          </p>
        </div>

        {/* Component score bars */}
        {result.componentScores && (
          <div className="flex-1 w-full sm:w-auto space-y-2">
            {Object.entries(result.componentScores).map(([key, val]) => {
              const pct = Math.round((val as number) * 100);
              const barColor = pct >= 80 ? '#22C55E' : pct >= 60 ? '#F59E0B' : '#EF4444';
              return (
                <div key={key}>
                  <div className="flex justify-between mb-0.5 text-xs">
                    <span className="capitalize" style={{ color: '#94A3B8' }}>{key.replace('_', ' ')}</span>
                    <span className="font-mono font-bold" style={{ color: '#E2E8F0' }}>{pct}%</span>
                  </div>
                  <div className="rounded-full h-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reasons & Warnings */}
      <div className="grid sm:grid-cols-2 gap-4">
        {result.reasons?.length > 0 && (
          <div className="rounded-2xl border p-4"
            style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.2)' }}>
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm" style={{ color: '#4ADE80' }}>
              ✅ Positive Signals
            </h3>
            <ul className="space-y-1.5">
              {result.reasons.map((r, i) => (
                <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#94A3B8' }}>
                  <span className="mt-0.5" style={{ color: '#4ADE80' }}>•</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.warnings?.length > 0 && (
          <div className="rounded-2xl border p-4"
            style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}>
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm" style={{ color: '#FBBF24' }}>
              ⚠️ Warnings
            </h3>
            <ul className="space-y-1.5">
              {result.warnings.map((w, i) => (
                <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#94A3B8' }}>
                  <span className="mt-0.5" style={{ color: '#FBBF24' }}>•</span>{w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Extracted Data */}
      {result.extractedData && (
        <div className="rounded-2xl border p-5" style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm" style={{ color: '#E2E8F0' }}>
            📋 Extracted Information
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              ['Recipient Name', result.extractedData.name],
              ['Issuing Institution', result.extractedData.issuer],
              ['Certificate Title', result.extractedData.certificate_title],
              ['Issue Date', result.extractedData.issue_date],
              ['Certificate ID', result.extractedData.certificate_id],
              ['Registration No.', result.extractedData.registration_number],
            ].map(([label, value]) => value ? (
              <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-xs mb-0.5" style={{ color: '#64748B' }}>{label}</p>
                <p className="text-sm font-medium" style={{ color: '#E2E8F0' }}>{value}</p>
              </div>
            ) : null)}
          </div>
          {result.extractedData.signatories?.length > 0 && (
            <div className="mt-3 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <p className="text-xs mb-1" style={{ color: '#64748B' }}>Signatories</p>
              <p className="text-sm" style={{ color: '#E2E8F0' }}>{result.extractedData.signatories.join(', ')}</p>
            </div>
          )}
        </div>
      )}

      {/* Issuer Validation */}
      {result.issuerValidation && (
        <div className="rounded-2xl border p-5" style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm" style={{ color: '#E2E8F0' }}>
            🏛️ Issuer Verification
          </h3>
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={result.issuerValidation.issuer_valid
                ? { background: 'rgba(34,197,94,0.15)', color: '#4ADE80' }
                : { background: 'rgba(239,68,68,0.15)', color: '#FCA5A5' }}>
              {result.issuerValidation.issuer_valid ? '✓' : '✗'}
            </span>
            <div>
              <p className="font-medium text-sm" style={{ color: '#E2E8F0' }}>
                {result.issuerValidation.matched_name || 'Not matched'}
              </p>
              <p className="text-xs" style={{ color: '#64748B' }}>
                Confidence: {Math.round(result.issuerValidation.issuer_confidence * 100)}%
                {result.issuerValidation.accredited && ' · Accredited'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tampering Report */}
      {result.tamperingResult && (
        <div className="rounded-2xl border p-5"
          style={{
            background: result.tamperingResult.tampering_detected ? 'rgba(239,68,68,0.06)' : '#1E293B',
            borderColor: result.tamperingResult.tampering_detected ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'
          }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm" style={{ color: '#E2E8F0' }}>
            🛡️ Forensic Analysis
          </h3>
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold"
              style={result.tamperingResult.tampering_detected
                ? { background: 'rgba(239,68,68,0.15)', color: '#FCA5A5' }
                : { background: 'rgba(34,197,94,0.15)', color: '#4ADE80' }}>
              {result.tamperingResult.tampering_detected ? 'Tampering Detected' : 'No Tampering'}
            </span>
            <span className="text-sm" style={{ color: '#64748B' }}>
              Score: {Math.round(result.tamperingResult.tampering_score * 100)}%
            </span>
          </div>
          {result.tamperingResult.issues?.length > 0 && (
            <ul className="space-y-1 mt-2">
              {result.tamperingResult.issues.map((issue, i) => (
                <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#FCA5A5' }}>
                  <span style={{ color: '#EF4444' }}>⚠</span> {issue}
                </li>
              ))}
            </ul>
          )}
          {result.tamperingResult.method_scores && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(result.tamperingResult.method_scores).map(([method, mScore]) => {
                const pct = Math.round((mScore as number) * 100);
                const mColor = pct <= 30 ? '#4ADE80' : pct <= 60 ? '#FBBF24' : '#EF4444';
                return (
                  <div key={method} className="rounded-lg p-2.5 text-xs border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <p className="capitalize mb-1" style={{ color: '#64748B' }}>{method.replace('_', ' ')}</p>
                    <p className="font-mono font-bold" style={{ color: mColor }}>{pct}%</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
