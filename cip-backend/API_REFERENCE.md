# CIP Backend API Reference

Base gateway URL: `http://localhost:8080`

## Core endpoints

### Auth

- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`

### Student / Profile

- `GET /student/profile`
- `PUT /student/profile`

### Resume

- `POST /resume/upload`
- `GET /resume`
- `GET /resume/latest`

Uploading a resume stores the file, extracts text, publishes `resume.uploaded`, and lets downstream scoring update from real parsed data.

### Score

- `GET /score`
- `POST /score/update` (admin/internal)
- `GET /score/leaderboard` (admin)

Current readiness formula in the score service:

`0.4 × resume + 0.6 × interview`

### Analytics / Progress

- `GET /analytics`
- `GET /analytics/platform`
- `GET /analytics/student/{id}`

The analytics service no longer fabricates CGPA or subject predictions. It aggregates:

- readiness
- average interview score
- weak topics
- attempt history
- progress history

### Interview

- `POST /interview/start`
- `POST /interview/answer`
- `POST /interview/end?interviewId={id}`
- `GET /interview/result/{id}`
- `GET /interview/history`

`/interview/start` now stores a session. The ML service is the single source of truth for:

- question generation
- answer evaluation
- coaching feedback

Example start payload:

```json
{
  "type": "TECHNICAL",
  "jobRole": "Backend Engineer",
  "numberOfQuestions": 5,
  "questions": [
    {
      "index": 0,
      "question": "Design an interview evaluation service",
      "topic": "System Design",
      "difficulty": "hard"
    }
  ]
}
```

Example answer payload:

```json
{
  "interviewId": 1,
  "questionIndex": 0,
  "question": "Design an interview evaluation service",
  "answer": "I would split ingestion, evaluation, storage, and event publishing...",
  "timeTakenSeconds": 95,
  "score": 78,
  "topic": "System Design",
  "difficulty": "hard",
  "feedback": {
    "good": "Clear structure",
    "missing": "Failure handling",
    "ideal": "Short ideal answer",
    "tip": "Cover tradeoffs"
  }
}
```

### Jobs

- `GET /jobs`
- `GET /jobs/{id}`
- `GET /jobs/recommended`
- `POST /jobs` (admin)
- `PUT /jobs/{id}` (admin)
- `DELETE /jobs/{id}` (admin)

The demo seed endpoint has been removed. Recommended jobs are computed from real stored jobs plus readiness and skill overlap.

Example:

`GET /jobs/recommended?readiness=68&skills=Java&skills=Spring%20Boot`

### Roadmap / Recommendations

- `GET /roadmap`
- `PUT /roadmap/task/{id}/complete`
- `GET /recommendations/jobs`

## Event flow

- `resume.uploaded` -> ML/resume parsing -> score update
- `interview.completed` -> score update
- `score-events` -> downstream readiness consumers
- `certificate-events` -> certificate status/result updates

## Certificate validation

The certificate flow uses:

- backend upload/storage
- ML OCR extraction
- tamper detection
- authenticity scoring
- persisted validation results

## Error format

```json
{
  "success": false,
  "error": "Description of what went wrong"
}
```
