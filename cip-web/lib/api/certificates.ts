// lib/api/certificates.ts
// Certificate API client — connects to certificate-service (port 8089)

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8089';

export interface UploadResponse {
  certificateId: number;
  status: string;
  message: string;
  fileName: string;
  createdAt: string;
}

export interface CertificateResponse {
  id: number;
  userId: number;
  fileName: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedData {
  name: string;
  issuer: string;
  certificate_title: string;
  issue_date: string;
  certificate_id: string;
  registration_number: string;
  signatories: string[];
  qr_code_data: string;
  ocr_confidence: number;
}

export interface IssuerValidation {
  issuer_valid: boolean;
  issuer_confidence: number;
  matched_name: string;
  issuer_type: string;
  matched_domain: string;
  accredited: boolean;
}

export interface TamperingResult {
  tampering_detected: boolean;
  tampering_score: number;
  issues: string[];
  method_scores: Record<string, number>;
}

export interface ComponentScores {
  ocr: number;
  issuer: number;
  id: number;
  anti_tamper: number;
}

export interface CertificateResult {
  certificateId: number;
  authenticityScore: number;
  status: string;
  confidenceLevel: string;
  extractedData: ExtractedData;
  issuerValidation: IssuerValidation;
  tamperingResult: TamperingResult;
  idValidation: Record<string, unknown>;
  componentScores: ComponentScores;
  reasons: string[];
  warnings: string[];
  processingTimeMs: number;
  createdAt: string;
  fileName: string;
  uploadedAt: string;
}

export interface CertificateSummary {
  id: number;
  fileName: string;
  status: string;
  authenticityScore?: number;
  authenticityStatus?: string;
  confidenceLevel?: string;
  createdAt: string;
}

export interface UserCertificatesResponse {
  certificates: CertificateSummary[];
  total: number;
  page: number;
  size: number;
}

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
    : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeader(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`API error ${res.status}: ${errorText}`);
  }

  return res.json();
}

/**
 * Upload a certificate file for validation
 */
export async function uploadCertificate(
  file: File,
  userId: number
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId.toString());

  return apiRequest<UploadResponse>('/certificates/upload', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Get certificate metadata and processing status
 */
export async function getCertificate(
  certificateId: number
): Promise<CertificateResponse> {
  return apiRequest<CertificateResponse>(`/certificates/${certificateId}`);
}

/**
 * Get full validation result with authenticity score
 */
export async function getCertificateResult(
  certificateId: number
): Promise<CertificateResult> {
  return apiRequest<CertificateResult>(`/certificates/${certificateId}/result`);
}

/**
 * Get all certificates for a user (paginated)
 */
export async function getUserCertificates(
  userId: number,
  page = 0,
  size = 10
): Promise<UserCertificatesResponse> {
  return apiRequest<UserCertificatesResponse>(
    `/certificates/user/${userId}?page=${page}&size=${size}`
  );
}

/**
 * Poll for result until COMPLETED or FAILED (max 60s)
 */
export async function pollForResult(
  certificateId: number,
  onUpdate?: (status: string) => void,
  maxWaitMs = 60000
): Promise<CertificateResult> {
  const interval = 2000;
  const maxAttempts = Math.ceil(maxWaitMs / interval);

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, interval));

    const cert = await getCertificate(certificateId);
    onUpdate?.(cert.status);

    if (cert.status === 'COMPLETED') {
      return getCertificateResult(certificateId);
    }
    if (cert.status === 'FAILED') {
      throw new Error(cert.errorMessage || 'Processing failed');
    }
  }

  throw new Error('Processing timeout — please check back later');
}

/**
 * Compute score color for UI display
 */
export function getScoreColor(score: number): string {
  if (score >= 85) return '#22c55e'; // green
  if (score >= 70) return '#84cc16'; // lime
  if (score >= 50) return '#f59e0b'; // amber
  if (score >= 30) return '#f97316'; // orange
  return '#ef4444'; // red
}

/**
 * Compute status badge color
 */
export function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'genuine': return 'bg-green-500/15 text-green-400';
    case 'likely genuine': return 'bg-lime-500/15 text-lime-400';
    case 'suspicious': return 'bg-yellow-500/15 text-yellow-400';
    case 'likely fake': return 'bg-orange-500/15 text-orange-400';
    case 'fake': return 'bg-red-500/15 text-red-400';
    default: return 'bg-white/5 text-gray-400';
  }
}
