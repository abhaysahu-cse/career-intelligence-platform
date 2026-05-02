"""
Shared Pydantic models for CIP ML Platform
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class ExperienceLevel(str, Enum):
    FRESHER = "Fresher"
    JUNIOR = "Junior"
    MID = "Mid-Level"
    SENIOR = "Senior"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ReadinessLevel(str, Enum):
    NOT_READY = "Not Ready"
    NEEDS_WORK = "Needs Work"
    ALMOST_READY = "Almost Ready"
    READY = "Ready"
    HIGHLY_READY = "Highly Ready"


# ─── Resume Models ────────────────────────────────────────────────────────────

class ResumeAnalyzeRequest(BaseModel):
    text: Optional[str] = None
    student_id: str
    job_role: Optional[str] = "SDE"


class SkillCategory(BaseModel):
    name: str
    proficiency: float = Field(ge=0.0, le=1.0)
    category: str  # e.g., "Languages", "Frameworks", "Tools"


class ResumeAnalyzeResponse(BaseModel):
    student_id: str
    skills: List[str]
    skill_details: List[SkillCategory]
    experience_level: ExperienceLevel
    education: Dict[str, Any]
    projects: int
    project_quality_score: float
    resume_score: float = Field(ge=0, le=100)
    missing_skills: List[str]
    role_match: Dict[str, float]  # role -> match %
    strengths: List[str]
    improvements: List[str]
    processing_time_ms: float


# ─── Academic Models ───────────────────────────────────────────────────────────

class SubjectMark(BaseModel):
    subject: str
    marks: float = Field(ge=0, le=100)
    credits: int = Field(ge=1, le=6)


class AcademicPredictRequest(BaseModel):
    student_id: str
    current_cgpa: float = Field(ge=0, le=10)
    semester: int = Field(ge=1, le=8)
    attendance_percent: float = Field(ge=0, le=100)
    subject_marks: List[SubjectMark]
    historical_cgpa: Optional[List[float]] = []


class AcademicPredictResponse(BaseModel):
    student_id: str
    predicted_cgpa: float
    risk_level: RiskLevel
    weak_subjects: List[str]
    strong_subjects: List[str]
    trend: str  # "improving", "declining", "stable"
    confidence: float
    recommendations: List[str]
    semester_forecast: Dict[str, float]


# ─── Interview Models ──────────────────────────────────────────────────────────

class InterviewEvaluateRequest(BaseModel):
    student_id: str
    question: str
    answer_text: str
    expected_answer: Optional[str] = None
    domain: str = "DSA"
    difficulty: str = "Medium"  # Easy / Medium / Hard
    audio_features: Optional[Dict[str, float]] = None  # from Whisper


class InterviewEvaluateResponse(BaseModel):
    student_id: str
    technical_score: float = Field(ge=0, le=100)
    confidence_score: float = Field(ge=0, le=100)
    communication_score: float = Field(ge=0, le=100)
    overall_score: float = Field(ge=0, le=100)
    feedback: str
    strengths: List[str]
    improvements: List[str]
    key_concepts_covered: List[str]
    key_concepts_missing: List[str]
    model_answer_hint: str


class InterviewAnswerHistory(BaseModel):
    question: str
    answer: str
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    accuracy: Optional[float] = None


class InterviewQuestionRequest(BaseModel):
    resume_data: Dict[str, Any] = {}
    job_role: str = "SDE"
    previous_answers: List[InterviewAnswerHistory] = []


class InterviewQuestionResponse(BaseModel):
    question: str
    difficulty: str
    topic: str
    expected_answer: str


# ─── Career Readiness Models ───────────────────────────────────────────────────

class CareerReadinessRequest(BaseModel):
    student_id: str
    resume_score: Optional[float] = None
    academic_score: Optional[float] = None
    interview_score: Optional[float] = None
    target_role: Optional[str] = "SDE"


class CareerReadinessResponse(BaseModel):
    student_id: str
    readiness_score: float = Field(ge=0, le=100)
    level: ReadinessLevel
    component_scores: Dict[str, float]
    weights_used: Dict[str, float]
    next_actions: List[str]
    estimated_ready_in_days: int
    top_gaps: List[str]
    percentile: float  # vs all students


# ─── Recommendation Models ─────────────────────────────────────────────────────

class JobListing(BaseModel):
    job_id: str
    title: str
    company: str
    required_skills: List[str]
    min_cgpa: float
    experience_level: str
    domain: str
    package_lpa: Optional[float] = None


class RecommendRequest(BaseModel):
    student_id: str
    student_skills: List[str]
    cgpa: float
    readiness_score: float
    interests: Optional[List[str]] = []
    preferred_domains: Optional[List[str]] = []
    jobs: List[JobListing]


class JobRecommendation(BaseModel):
    job_id: str
    title: str
    company: str
    match_score: float = Field(ge=0, le=5)
    match_percent: float
    reason: str
    skill_gap: List[str]
    skill_match: List[str]


class RecommendResponse(BaseModel):
    student_id: str
    recommendations: List[JobRecommendation]
    total_jobs_analyzed: int
    personalization_factors: List[str]
