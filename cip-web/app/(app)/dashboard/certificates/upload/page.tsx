'use client';
// app/dashboard/certificates/upload/page.tsx

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { uploadCertificate, pollForResult } from '@/lib/api/certificates';

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
        <h1 className="text-2xl font-bold text-gray-900">Verify Certificate</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Upload a PDF or image. Our AI will check authenticity in under 8 seconds.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}
          ${file ? 'border-green-400 bg-green-50' : ''}`}
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
            <div className="text-5xl mb-4">📄</div>
            <p className="text-lg font-medium text-gray-700">
              Drop your certificate here
            </p>
            <p className="text-sm text-gray-500 mt-1">or click to browse</p>
            <p className="text-xs text-gray-400 mt-3">PDF, JPG, PNG · Max 10MB</p>
          </div>
        ) : (
          <div className="pointer-events-none">
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow mb-3 object-contain" />
            ) : (
              <div className="text-5xl mb-3">📑</div>
            )}
            <p className="font-semibold text-gray-800">{file.name}</p>
            <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Status */}
      {isLoading && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span className="text-blue-700 text-sm font-medium">{statusMsg}</span>
          </div>
          <div className="mt-3 bg-blue-100 rounded-full h-1.5">
            <div className={`bg-blue-500 h-full rounded-full transition-all duration-1000
              ${stage === 'uploading' ? 'w-1/4' : 'w-3/4 animate-pulse'}`} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        {file && !isLoading && (
          <button
            onClick={reset}
            className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        )}
        <button
          onClick={handleUpload}
          disabled={!file || isLoading}
          className={`flex-1 py-3 px-6 font-semibold rounded-xl transition-all duration-200
            ${!file || isLoading
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
            }`}
        >
          {isLoading ? 'Processing...' : 'Verify Certificate'}
        </button>
      </div>

      {/* Info */}
      <div className="mt-8 grid grid-cols-3 gap-4 text-center text-xs text-gray-500">
        {[
          { icon: '🔍', label: 'OCR Extraction' },
          { icon: '🏛️', label: 'Issuer Validation' },
          { icon: '🛡️', label: 'Tamper Detection' },
        ].map((item) => (
          <div key={item.label} className="p-3 bg-gray-50 rounded-xl">
            <div className="text-2xl mb-1">{item.icon}</div>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
