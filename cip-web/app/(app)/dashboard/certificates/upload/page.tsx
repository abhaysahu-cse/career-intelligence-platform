'use client';
// app/dashboard/certificates/upload/page.tsx

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { uploadCertificate, pollForResult } from '@/lib/api/certificates';
import { Upload, FileText, Search, Shield, ShieldCheck, AlertCircle } from 'lucide-react';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_SIZE = 10 * 1024 * 1024;

type UploadStage = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [stage, setStage] = useState<UploadStage>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // User ID — from auth context in production
  const userId = typeof window !== 'undefined'
    ? Number(localStorage.getItem('userId') || '1')
    : 1;

  const handleFile = useCallback((f: File) => {
    setError('');
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError('Only PDF, JPG, and PNG files are supported.');
      return;
    }
    if (f.size > MAX_SIZE) {
      setError('File size must be under 10MB.');
      return;
    }
    setFile(f);
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setError('');
    setStage('uploading');
    setStatusMsg('Uploading certificate...');

    try {
      const resp = await uploadCertificate(file, userId);
      setStage('processing');
      setStatusMsg('Analyzing certificate with AI...');

      await pollForResult(
        resp.certificateId,
        (status) => {
          const msgs: Record<string, string> = {
            PENDING: 'Queued for processing...',
            PROCESSING: 'Running OCR, issuer check, and tampering detection...',
          };
          setStatusMsg(msgs[status] || 'Processing...');
        }
      );

      setStage('done');
      router.push(`/dashboard/certificates/${resp.certificateId}`);
    } catch (err: unknown) {
      setStage('error');
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setStage('idle');
    setStatusMsg('');
    setError('');
  };

  const isLoading = stage === 'uploading' || stage === 'processing';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne,sans-serif', color: '#FFFFFF' }}>Verify Certificate</h1>
        <p className="mt-1 text-sm" style={{ color: '#A1A1AA' }}>
          Upload a PDF or image. Our AI will check authenticity in under 8 seconds.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className="relative rounded-2xl p-10 text-center transition-all duration-200 border-2 border-dashed"
        style={{
          background: dragOver ? 'rgba(79,70,229,0.1)' : file ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)',
          borderColor: dragOver ? '#4F46E5' : file ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.12)',
        }}
      >
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={onInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />

        {!file ? (
          <div className="pointer-events-none">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(79,70,229,0.12)' }}>
              <Upload size={28} style={{ color: '#818CF8' }} />
            </div>
            <p className="text-lg font-medium" style={{ color: '#FFFFFF' }}>
              Drop your certificate here
            </p>
            <p className="text-sm mt-1" style={{ color: '#A1A1AA' }}>or click to browse</p>
            <p className="text-xs mt-3" style={{ color: '#71717A' }}>PDF, JPG, PNG · Max 10MB</p>
          </div>
        ) : (
          <div className="pointer-events-none">
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow mb-3 object-contain" />
            ) : (
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.12)' }}>
                <FileText size={28} style={{ color: '#4ADE80' }} />
              </div>
            )}
            <p className="font-semibold" style={{ color: '#FFFFFF' }}>{file.name}</p>
            <p className="text-sm" style={{ color: '#A1A1AA' }}>{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 rounded-xl flex items-start gap-2"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#FCA5A5' }} />
          <span className="text-sm" style={{ color: '#FCA5A5' }}>{error}</span>
        </div>
      )}

      {/* Status */}
      {isLoading && (
        <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)' }}>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin flex-shrink-0"
              style={{ borderColor: '#818CF8', borderTopColor: 'transparent' }} />
            <span className="text-sm font-medium" style={{ color: '#A5B4FC' }}>{statusMsg}</span>
          </div>
          <div className="mt-3 rounded-full h-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className={`h-full rounded-full transition-all duration-1000
              ${stage === 'uploading' ? 'w-1/4' : 'w-3/4 animate-pulse'}`}
              style={{ background: 'linear-gradient(90deg, #4F46E5, #06B6D4)' }} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        {file && !isLoading && (
          <button
            onClick={reset}
            className="flex-1 py-3 px-6 font-medium rounded-xl border transition-all hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#A1A1AA' }}
          >
            Clear
          </button>
        )}
        <button
          onClick={handleUpload}
          disabled={!file || isLoading}
          className="flex-1 py-3 px-6 font-semibold rounded-xl transition-all duration-200"
          style={!file || isLoading
            ? { background: 'rgba(255,255,255,0.05)', color: '#71717A', cursor: 'not-allowed' }
            : { background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: '#fff' }}
        >
          {isLoading ? 'Processing...' : 'Verify Certificate'}
        </button>
      </div>

      {/* Info */}
      <div className="mt-8 grid grid-cols-3 gap-4 text-center text-xs">
        {[
          { icon: Search, label: 'OCR Extraction', color: '#818CF8' },
          { icon: Shield, label: 'Issuer Validation', color: '#67E8F9' },
          { icon: ShieldCheck, label: 'Tamper Detection', color: '#4ADE80' },
        ].map((item) => (
          <div key={item.label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <item.icon size={20} className="mx-auto mb-2" style={{ color: item.color }} />
            <span style={{ color: '#A1A1AA' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
