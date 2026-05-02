// ─── Auth ───────────────────────────────────────────────────────────────────
export type UserRole = 'student' | 'faculty';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  college?: string;
  branch?: string;
  year?: number;
  cgpa?: number;
  skills?: string[];
}

// ─── Score ──────────────────────────────────────────────────────────────────
export type ReadinessLevel = 'Not Ready' | 'Almost Ready' | 'Ready to Apply';

export interface ScoreBreakdown {
  resume: number;
  skills: number;
  interview: number;
  academics?: number;
}

export interface ReadinessScore {
  readiness: number;
  level: ReadinessLevel;
  breakdown: ScoreBreakdown;
  lastUpdated: string;
}

// ─── Analytics ──────────────────────────────────────────────────────────────
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Subject {
  name: string;
  score: number;
  maxScore: number;
  credits?: number;
}

export interface Analytics {
  risk: RiskLevel;
  readiness: number;
  resumeScore: number;
  interviewScore: number;
  averageInterviewScore: number;
  totalAttempts: number;
  weakSkills: string[];
  latestRecommendation?: string;
  progressHistory: { date: string; score: number }[];
  interviewHistory: { date: string; score: number }[];
}

// ─── Interview ───────────────────────────────────────────────────────────────
export type InterviewStatus = 'idle' | 'starting' | 'active' | 'paused' | 'ended';

export interface LiveMetrics {
  confidence: number;
  accuracy: number;
  fluency?: number;
  hint?: string;
}

export interface InterviewQuestion {
  id: string;
  text: string;
  category: 'technical' | 'behavioral' | 'system-design';
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface InterviewResult {
  id: string;
  date: string;
  role: string;
  scores: {
    technical: number;
    communication: number;
    confidence: number;
    overall: number;
  };
  mistakes: { question: string; feedback: string }[];
  suggestions: string[];
  duration: number;
}

// ─── Jobs ────────────────────────────────────────────────────────────────────
export interface Job {
  id: number;
  company: string;
  role: string;
  location: string;
  type: 'Full-time' | 'Internship' | 'Part-time';
  match: number;
  minScore: number;
  salary?: string;
  skills: string[];
  logo?: string;
  url: string;
  deadline?: string;
  isRecommended: boolean;
}

// ─── Roadmap ─────────────────────────────────────────────────────────────────
export interface RoadmapTask {
  id: string;
  week: number;
  task: string;
  description?: string;
  completed: boolean;
  category: 'skill' | 'project' | 'interview' | 'apply';
  resources?: { title: string; url: string }[];
}

// ─── Admin ───────────────────────────────────────────────────────────────────
export interface StudentRecord {
  id: string;
  name: string;
  email: string;
  branch: string;
  year: number;
  cgpa: number;
  readiness: number;
  risk: RiskLevel;
  lastActive: string;
  interviewScore?: number;
}
