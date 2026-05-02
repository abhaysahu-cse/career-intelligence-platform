import axios from 'axios';
import Cookies from 'js-cookie';

// API Gateway (Spring Boot) — all backend calls go here
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ML Service (FastAPI) — direct ML calls
const ML_URL = process.env.NEXT_PUBLIC_ML_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export const mlApi = axios.create({
  baseURL: ML_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT from cookie
api.interceptors.request.use((config) => {
  const token = Cookies.get('cip_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      Cookies.remove('cip_token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
// Gateway routes: /auth/** → auth-service:8081
export const authApi = {
  login:     (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  signup:    (data: { name: string; email: string; password: string; role: string }) =>
    api.post('/auth/signup', data),
  me:        () => api.get('/auth/me'),
  logout:    () => api.post('/auth/logout'),
  verifyOtp: (data: { email: string; otp: string }) =>
    api.post('/auth/verify-otp', data),
};

// ─── Student ──────────────────────────────────────────────────────────────────
// Gateway routes: /student/** → student-service:8082
export const studentApi = {
  getProfile:    () => api.get('/student/profile'),
  updateProfile: (data: unknown) => api.put('/student/profile', data),
  uploadResume:  (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/resume/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ─── Score ────────────────────────────────────────────────────────────────────
// Gateway routes: /score/** → score-service:8084
export const scoreApi = {
  get:    () => api.get('/score'),
  getById: (studentId: string) => api.get(`/score/${studentId}`),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
// Gateway routes: /analytics/** → analytics-service:8085
export const analyticsApi = {
  get:        () => api.get('/analytics'),
  getStudent: (studentId: string) => api.get(`/analytics/student/${studentId}`),
};

// ─── Interview ────────────────────────────────────────────────────────────────
// Gateway routes: /interview/** → interview-service:8086
export const interviewApi = {
  start:     (data: { jobRole: string; type?: string; numberOfQuestions?: number; questions?: unknown[] }) =>
    api.post('/interview/start', data),
  answer:    (data: {
    interviewId: number;
    questionIndex: number;
    question: string;
    answer: string;
    timeTakenSeconds?: number;
    score?: number;
    topic?: string;
    difficulty?: string;
    feedback?: unknown;
  }) => api.post('/interview/answer', data),
  end:       (interviewId: number) => api.post(`/interview/end?interviewId=${interviewId}`),
  getResult: (id: string) => api.get(`/interview/result/${id}`),
  history:   () => api.get('/interview/history'),
};

// ─── Jobs ─────────────────────────────────────────────────────────────────────
// Gateway routes: /jobs/** → job-service:8087
export const jobsApi = {
  list:        (params?: { role?: string; location?: string; minScore?: number }) =>
    api.get('/jobs', { params }),
  recommended: (params?: { readiness?: number; skills?: string[] }) => api.get('/jobs/recommended', { params }),
  apply:       (jobId: number) => api.post(`/jobs/${jobId}/apply`),
};

// ─── Roadmap / Recommendations ────────────────────────────────────────────────
// Gateway routes: /roadmap/**, /recommendations/** → recommendation-service:8088
export const roadmapApi = {
  get:          () => api.get('/roadmap'),
  completeTask: (taskId: string) => api.put(`/roadmap/task/${taskId}/complete`),
};

export const recommendApi = {
  getJobs: () => api.get('/recommendations/jobs'),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
// Gateway routes: /student/admin/** → student-service:8082 (admin endpoints)
export const adminApi = {
  getStudents:   (params?: { risk?: string; search?: string }) =>
    api.get('/student/admin/students', { params }),
  exportCsv:     () => api.get('/student/admin/export', { responseType: 'blob' }),
  getBatchStats: () => api.get('/student/admin/batch-stats'),
};

// ─── ML Direct Endpoints ──────────────────────────────────────────────────────
// Calls FastAPI ML service directly (port 8000)
export const mlServiceApi = {
  analyzeResume: (data: { text: string; student_id: string; job_role?: string }) =>
    mlApi.post('/ml/resume/analyze', data),
  predictAcademic: (data: unknown) =>
    mlApi.post('/ml/predict', data),
  evaluateInterview: (data: {
    student_id: string;
    question: string;
    answer_text: string;
    expected_answer?: string;
    domain?: string;
    difficulty?: string;
  }) =>
    mlApi.post('/ml/interview/evaluate', data),
  generateInterviewQuestion: (data: {
    resume_data: Record<string, unknown>;
    job_role: string;
    previous_answers: Array<{
      question: string;
      answer: string;
      topic?: string;
      difficulty?: string;
      accuracy?: number;
    }>;
  }) =>
    mlApi.post('/ml/interview/question', data),
  coachInterviewAnswer: (data: {
    answer: string;
    job_role: string;
    resume_skills: string[];
    question: string;
    expected_answer?: string;
    topic?: string;
    persona_mode?: string;
  }) =>
    mlApi.post('/ml/interview/coach', data),
  computeReadiness: (data: unknown) =>
    mlApi.post('/ml/readiness', data),
  recommend: (data: unknown) =>
    mlApi.post('/ml/recommend', data),
};

// WebSocket URL export
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
