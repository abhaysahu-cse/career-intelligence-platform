'use client';
// app/dashboard/certificates/[id]/page.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getCertificateResult,
  getCertificate,
  getScoreColor,
  getStatusColor,
  CertificateResult,
} from '@/lib/api/certificates';

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
        // Poll every 3 seconds
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

  if (loading) return <LoadingSpinner />;

  if (processing) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Analyzing Certificate</h2>
      <p className="text-gray-500 text-sm mb-6">Running OCR, issuer validation, and tamper detection...</p>
      <div className="w-64 mx-auto bg-gray-200 rounded-full h-2">
        <div className="bg-blue-500 h-2 rounded-full animate-pulse w-2/3" />
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">❌</div>
      <h2 className="text-xl font-semibold text-red-700 mb-2">Processing Failed</h2>
      <p className="text-gray-500 text-sm">{error}</p>
      <button onClick={() => router.push('/dashboard/certificates/upload')}
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
        Try Again
      </button>
    </div>
  );

  if (!result) return null;

  const score = result.authenticityScore ?? 0;
  const color = getScoreColor(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/dashboard/certificates')}
          className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-gray-900">{result.fileName}</h1>
      </div>

      {/* Score Hero */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-36 h-36 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black" style={{ color }}>{score}</span>
            <span className="text-xs text-gray-400 font-medium">/ 100</span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-2 ${getStatusColor(result.status)}`}>
            {result.status}
          </div>
          <p className="text-gray-500 text-sm">Confidence: <span className="font-medium text-gray-700">{result.confidenceLevel}</span></p>
          <p className="text-gray-400 text-xs mt-1">
            Processed in {result.processingTimeMs ? `${(result.processingTimeMs / 1000).toFixed(1)}s` : '—'}
          </p>
        </div>
        {/* Component score bars */}
        {result.componentScores && (
          <div className="flex-1 w-full sm:w-auto grid grid-cols-2 gap-2 text-xs text-gray-600">
            {Object.entries(result.componentScores).map(([key, val]) => (
              <div key={key}>
                <div className="flex justify-between mb-0.5">
                  <span className="capitalize">{key.replace('_', ' ')}</span>
                  <span className="font-medium">{Math.round((val as number) * 100)}%</span>
                </div>
                <div className="bg-gray-100 rounded-full h-1.5">
                  <div className="h-full rounded-full bg-blue-400"
                    style={{ width: `${Math.round((val as number) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reasons & Warnings */}
      <div className="grid sm:grid-cols-2 gap-4">
        {result.reasons?.length > 0 && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
            <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              <span>✅</span> Positive Signals
            </h3>
            <ul className="space-y-1.5">
              {result.reasons.map((r, i) => (
                <li key={i} className="text-green-700 text-sm flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.warnings?.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
              <span>⚠️</span> Warnings
            </h3>
            <ul className="space-y-1.5">
              {result.warnings.map((w, i) => (
                <li key={i} className="text-amber-700 text-sm flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">•</span>{w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Extracted Data */}
      {result.extractedData && (
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>📋</span> Extracted Information
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
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value}</p>
              </div>
            ) : null)}
          </div>
          {result.extractedData.signatories?.length > 0 && (
            <div className="mt-3 bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Signatories</p>
              <p className="text-sm text-gray-800">{result.extractedData.signatories.join(', ')}</p>
            </div>
          )}
        </div>
      )}

      {/* Issuer Validation */}
      {result.issuerValidation && (
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>🏛️</span> Issuer Verification
          </h3>
          <div className="flex items-center gap-3 mb-3">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
              ${result.issuerValidation.issuer_valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {result.issuerValidation.issuer_valid ? '✓' : '✗'}
            </span>
            <div>
              <p className="font-medium text-gray-800">
                {result.issuerValidation.matched_name || 'Not matched'}
              </p>
              <p className="text-xs text-gray-500">
                Confidence: {Math.round(result.issuerValidation.issuer_confidence * 100)}%
                {result.issuerValidation.accredited && ' · Accredited'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tampering Report */}
      {result.tamperingResult && (
        <div className={`rounded-2xl shadow-sm border p-5
          ${result.tamperingResult.tampering_detected ? 'bg-red-50 border-red-100' : 'bg-white'}`}>
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>🛡️</span> Forensic Analysis
          </h3>
          <div className="flex items-center gap-3 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold
              ${result.tamperingResult.tampering_detected
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'}`}>
              {result.tamperingResult.tampering_detected ? 'Tampering Detected' : 'No Tampering'}
            </span>
            <span className="text-sm text-gray-500">
              Score: {Math.round(result.tamperingResult.tampering_score * 100)}%
            </span>
          </div>
          {result.tamperingResult.issues?.length > 0 && (
            <ul className="space-y-1 mt-2">
              {result.tamperingResult.issues.map((issue, i) => (
                <li key={i} className="text-red-700 text-sm flex items-start gap-2">
                  <span className="text-red-400">⚠</span> {issue}
                </li>
              ))}
            </ul>
          )}
          {result.tamperingResult.method_scores && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(result.tamperingResult.method_scores).map(([method, score]) => (
                <div key={method} className="bg-white rounded-lg p-2 text-xs border">
                  <p className="text-gray-400 capitalize">{method.replace('_', ' ')}</p>
                  <p className="font-semibold text-gray-700">{Math.round((score as number) * 100)}%</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
