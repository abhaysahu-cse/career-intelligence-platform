# CIP ML Platform — API Documentation

## Base URL
```
http://localhost:8000
```

## Authentication
Currently open (add JWT via `Authorization: Bearer <token>` header in production).

---

## Endpoints

### `GET /health`
Returns system health and module status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1718000000.0,
  "modules": {
    "resume_analyzer": "active",
    "academic_predictor": "active",
    "interview_evaluator": "active",
    "career_readiness": "active",
    "recommendation_engine": "active"
  },
  "kafka": "connected"
}
```

---

### `POST /ml/resume/analyze`
**Module 1 — Resume Analyzer**

Converts resume text into structured intelligence.

**Request:**
```json
{
  "student_id": "STU001",
  "text": "Full resume text here...",
  "job_role": "SDE"
}
```

**Response:**
```json
{
  "student_id": "STU001",
  "skills": ["Java", "Spring Boot", "DSA", "Docker", "AWS"],
  "skill_details": [
    {"name": "Java", "proficiency": 0.75, "category": "Languages"}
  ],
  "experience_level": "Fresher",
  "education": {
    "degree": "B.Tech",
    "branch": "Computer Science",
    "cgpa": 8.2,
    "year": 2024,
    "institution": "Unknown"
  },
  "projects": 3,
  "project_quality_score": 72.0,
  "resume_score": 78.5,
  "missing_skills": ["System Design", "Kubernetes"],
  "role_match": {
    "SDE": 82.0,
    "Backend": 78.0,
    "Data Science": 45.0,
    "DevOps": 55.0,
    "Frontend": 60.0
  },
  "strengths": [
    "Strong skill set (18 skills identified)",
    "Good project portfolio (3 projects)"
  ],
  "improvements": [
    "Add certifications or open source contributions"
  ],
  "processing_time_ms": 12.4
}
```

---

### `POST /ml/predict`
**Module 2 — Academic Predictor**

Predicts future academic performance with risk classification.

**Request:**
```json
{
  "student_id": "STU001",
  "current_cgpa": 7.8,
  "semester": 5,
  "attendance_percent": 72,
  "subject_marks": [
    {"subject": "DSA", "marks": 58, "credits": 4},
    {"subject": "Database", "marks": 72, "credits": 3},
    {"subject": "Mathematics", "marks": 55, "credits": 4}
  ],
  "historical_cgpa": [7.2, 7.5, 7.8, 7.6]
}
```

**Response:**
```json
{
  "student_id": "STU001",
  "predicted_cgpa": 7.63,
  "current_sgpa": 6.82,
  "risk_level": "MEDIUM",
  "weak_subjects": ["DSA", "Mathematics"],
  "strong_subjects": ["Software Engineering"],
  "trend": "stable",
  "confidence": 0.75,
  "recommendations": [
    "Improve attendance from 72% to at least 85%",
    "Focus on DSA — consider tutoring or extra practice",
    "Create a structured weekly study plan"
  ],
  "semester_forecast": {
    "Sem 6": 7.65,
    "Sem 7": 7.63,
    "Sem 8": 7.65
  }
}
```

---

### `POST /ml/interview/evaluate`
**Module 3 — Interview Evaluator** ⭐ Most Important

Evaluates answer quality across technical, communication, and confidence dimensions.

**Request:**
```json
{
  "student_id": "STU001",
  "question": "What is Big O notation?",
  "answer_text": "Big O notation describes the time complexity...",
  "expected_answer": "Optional reference answer",
  "domain": "DSA",
  "difficulty": "Easy",
  "audio_features": {
    "words_per_minute": 140,
    "pause_ratio": 0.12,
    "pitch_variance": 0.45,
    "volume_consistency": 0.80
  }
}
```

**Response:**
```json
{
  "student_id": "STU001",
  "technical_score": 59.7,
  "confidence_score": 70.0,
  "communication_score": 83.0,
  "overall_score": 68.8,
  "feedback": "Good attempt. Focus on adding: upper bound, worst case.",
  "strengths": [
    "Shows foundational technical understanding",
    "Correctly covered: time complexity, algorithms, O(log n)",
    "Clear and well-structured communication"
  ],
  "improvements": [
    "Study missing concepts: upper bound, space complexity",
    "Avoid uncertain phrases — speak with conviction"
  ],
  "key_concepts_covered": ["time complexity", "algorithms", "O(log n)"],
  "key_concepts_missing": ["upper bound", "space complexity", "worst case"],
  "model_answer_hint": "Big O notation describes the upper bound of an algorithm's time or space complexity as input grows, representing the worst-case scenario."
}
```

**Supported Domains:** `DSA`, `OOP`, `System Design`, `OS`, `Networks`, `Database`
**Difficulty Levels:** `Easy`, `Medium`, `Hard`

---

### `POST /ml/readiness`
**Module 4 — Career Readiness Model**

Computes unified career readiness score with explainable weights.

**Request:**
```json
{
  "student_id": "STU001",
  "resume_score": 78.5,
  "academic_score": 76.3,
  "interview_score": 68.8,
  "target_role": "SDE"
}
```

**Response:**
```json
{
  "student_id": "STU001",
  "readiness_score": 74.2,
  "level": "Ready",
  "component_scores": {
    "resume": 78.5,
    "academic": 76.3,
    "interview": 68.8
  },
  "weights_used": {
    "resume": 0.35,
    "academic": 0.25,
    "interview": 0.40
  },
  "next_actions": [
    "Apply to full-time roles and practice HR rounds",
    "Solve 100+ LeetCode problems",
    "Study System Design basics"
  ],
  "estimated_ready_in_days": 0,
  "top_gaps": ["Interview Score: 69/100"],
  "percentile": 66.7
}
```

**Readiness Levels:**
| Score Range | Level |
|-------------|-------|
| 80-100 | Highly Ready |
| 65-79 | Ready |
| 50-64 | Almost Ready |
| 35-49 | Needs Work |
| 0-34 | Not Ready |

**Role-Specific Weights:**
| Role | Resume | Academic | Interview |
|------|--------|----------|-----------|
| SDE | 35% | 25% | 40% |
| Data Science | 30% | 35% | 35% |
| DevOps | 45% | 15% | 40% |
| Frontend | 40% | 20% | 40% |

---

### `POST /ml/recommend`
**Module 5 — Recommendation Engine**

Ranks and recommends jobs based on student profile.

**Request:**
```json
{
  "student_id": "STU001",
  "student_skills": ["Java", "Spring Boot", "Docker", "AWS", "DSA"],
  "cgpa": 8.2,
  "readiness_score": 74.2,
  "interests": ["backend", "cloud"],
  "preferred_domains": ["SDE", "Backend"],
  "jobs": [
    {
      "job_id": "J001",
      "title": "SDE Intern",
      "company": "Google",
      "required_skills": ["Java", "DSA", "System Design"],
      "min_cgpa": 7.5,
      "experience_level": "Fresher",
      "domain": "SDE",
      "package_lpa": 12
    }
  ]
}
```

**Response:**
```json
{
  "student_id": "STU001",
  "recommendations": [
    {
      "job_id": "J002",
      "title": "Backend Dev",
      "company": "Flipkart",
      "match_score": 4.42,
      "match_percent": 88.4,
      "reason": "Excellent skill match (3/4 skills) — meets CGPA — matches interests",
      "skill_match": ["Java", "Spring Boot", "Docker"],
      "skill_gap": ["MySQL"]
    }
  ],
  "total_jobs_analyzed": 3,
  "personalization_factors": [
    "Skill compatibility analysis",
    "High CGPA eligibility match",
    "Domain preference: SDE, Backend",
    "Interest alignment: backend, cloud"
  ]
}
```

**Match Score Scale:** 0–5 (5 = perfect match)

---

## Kafka Topics

| Topic | Direction | Publisher | Consumer |
|-------|-----------|-----------|----------|
| `resume-events` | Incoming | Backend | ML Service |
| `interview-events` | Incoming | Backend | ML Service |
| `student-events` | Incoming | Backend | ML Service |
| `score-events` | Outgoing | ML Service | Backend |
| `recommendation-events` | Outgoing | ML Service | Backend |

### Event Payload Examples

**`resume-events` (incoming):**
```json
{
  "student_id": "STU001",
  "resume_text": "...",
  "job_role": "SDE"
}
```

**`score-events` (outgoing — resume):**
```json
{
  "event_type": "resume_scored",
  "student_id": "STU001",
  "resume_score": 78.5,
  "skills": ["Java", "Python"],
  "missing_skills": ["System Design"],
  "timestamp": 1718000000.0,
  "source": "ml-resume-analyzer"
}
```

---

## Docker Deployment

```bash
# Start full stack
docker-compose up -d

# View logs
docker-compose logs -f ml-api

# Scale ML workers
docker-compose up -d --scale ml-api=3

# Stop
docker-compose down
```

**Services started:**
- `ml-api` → port 8000 (FastAPI)
- `kafka` → port 9092
- `kafka-ui` → port 8080
- `redis` → port 6379

---

## Performance

| Metric | Target | Actual |
|--------|--------|--------|
| Resume Analysis | < 2s | ~15ms |
| Academic Prediction | < 1s | ~5ms |
| Interview Evaluation | < 2s | ~20ms |
| Career Readiness | < 500ms | ~3ms |
| Job Recommendation (100 jobs) | < 2s | ~30ms |
