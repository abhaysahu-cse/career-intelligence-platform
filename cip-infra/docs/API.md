# CIP Infrastructure — API & Integration Documentation

## Overview

The CIP infrastructure consists of four core services:

| Service | Port | Purpose |
|---------|------|---------|
| WebSocket Server | 3001 | Real-time event delivery to frontend |
| Job Worker | 3002 | Job ingestion + background scheduling |
| Storage Service | 3003 | Resume and file storage |
| Kafka UI | 8090 | Kafka management dashboard |
| Prometheus | 9090 | Metrics collection |
| Grafana | 3004 | Metrics dashboards |

---

## 1. WebSocket API

### Connection

```
ws://localhost:3001
```

**Authentication** — pass JWT in connection options:

```js
const socket = io("http://localhost:3001", {
  auth: { token: "Bearer <your-jwt-token>" }
});
```

Or use the CIP client SDK at `shared/utils/cipSocketClient.js`.

### Server → Client Events

#### `score:update`
Fired when a student's readiness score changes.
```json
{
  "type": "score_update",
  "user_id": "123",
  "readiness": 72,
  "domain_scores": {
    "technical": 75,
    "communication": 68,
    "problem_solving": 80,
    "cultural_fit": 65
  },
  "trend": "up",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### `interview:feedback`
Fired when ML service completes interview analysis.
```json
{
  "type": "interview_feedback",
  "user_id": "123",
  "interview_id": "abc-456",
  "score": 78,
  "feedback": {
    "summary": "Strong technical answers...",
    "strengths": ["clear communication", "structured thinking"],
    "improvements": ["depth on system design"]
  },
  "timestamp": "2024-01-15T10:35:00Z"
}
```

#### `interview:started` / `interview:completed`
```json
{ "interview_id": "abc-456", "timestamp": "..." }
```

#### `job:new`
Broadcast to ALL connected users when a new job is ingested.
```json
{
  "type": "new_job",
  "job_id": "job-hash-abc",
  "company": "Stripe",
  "role": "Backend Engineer",
  "location": "San Francisco, CA",
  "timestamp": "..."
}
```

#### `job:update`
Sent to users subscribed to a specific job.
```json
{ "type": "job_update", "job_id": "...", "changes": {...} }
```

#### `notification`
```json
{
  "type": "NOTIFICATION_CREATED",
  "title": "Interview Ready",
  "message": "Your feedback is available.",
  "severity": "success",
  "action_url": "/interviews/abc-456",
  "timestamp": "..."
}
```

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `subscribe:job` | `jobId: string` | Subscribe to updates for a specific job |
| `unsubscribe:job` | `jobId: string` | Unsubscribe from job updates |
| `subscribe:interview` | `interviewId: string` | Subscribe to interview room |
| `ping` | callback | Latency check |

---

## 2. Storage Service API

All endpoints require `Authorization: Bearer <token>` header.

### Upload Resume

```
POST /api/storage/upload/resume
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body: { file: <file> }
```

**Response:**
```json
{
  "file_id": "uuid",
  "key": "resumes/userId/uuid.pdf",
  "original_name": "my-resume.pdf",
  "size": 102400,
  "content_type": "application/pdf",
  "url": "https://signed-url...",
  "url_expires_at": "2024-01-15T11:30:00Z",
  "uploaded_at": "2024-01-15T10:30:00Z",
  "uploaded_by": "userId"
}
```

### Get Signed URL

```
GET /api/storage/signed-url?key=resumes/userId/uuid.pdf
Authorization: Bearer <token>
```

**Response:**
```json
{
  "url": "https://...",
  "key": "resumes/userId/uuid.pdf",
  "expires_in": 3600,
  "expires_at": "2024-01-15T11:30:00Z"
}
```

### Delete File

```
DELETE /api/storage/file
Authorization: Bearer <token>
Content-Type: application/json

{ "key": "resumes/userId/uuid.pdf" }
```

### Upload Flow

```
Frontend → POST /api/storage/upload/resume
        ← { file_id, key, url }
Frontend → POST /api/your-backend/resume { file_id, key }
Backend  → publishes resume-events:RESUME_UPLOADED to Kafka
ML       → consumes, parses resume
ML       → publishes resume-events:RESUME_PARSED
Backend  → updates DB
WS       → notifies frontend
```

---

## 3. Kafka Topics

### Topics Summary

| Topic | Partitions | Retention | Purpose |
|-------|-----------|-----------|---------|
| `student-events` | 3 | 7 days | User profile & registration events |
| `resume-events` | 3 | 7 days | Resume upload, parse, results |
| `interview-events` | 3 | 7 days | Interview lifecycle |
| `score-events` | 3 | 7 days | Readiness score updates |
| `job-events` | 6 | 30 days | Job ingestion & matching |
| `notification-events` | 3 | 1 day | User notifications |
| `*.dlq` | 1 | 30 days | Dead letter queues for failed events |

### Event Structure (all topics)

```json
{
  "event_type": "SCREAMING_SNAKE_CASE",
  "user_id": "string or null",
  "timestamp": "2024-01-15T10:30:00Z",
  "source": "service-name",
  "version": "1.0",
  "payload": { ... }
}
```

### Publishing from Your Service

```js
const { CIPKafkaProducer } = require("./shared/utils/kafkaProducer");

const producer = new CIPKafkaProducer({ serviceName: "my-backend" });
await producer.connect();

// Publish a single event
await producer.publish(
  "interview-events",
  "INTERVIEW_COMPLETED",
  {
    user_id: "123",
    interview_id: "abc-456",
    answers: [...],
    duration: 300,
  },
  "123"  // partition key = userId for ordering
);
```

### Consumer Group IDs

| Service | Group ID |
|---------|----------|
| WebSocket Server | `websocket-consumer-group` |
| Job Worker | `job-worker-consumer-group` |
| Your ML Service | `ml-consumer-group` (you define) |
| Your Backend | `backend-consumer-group` (you define) |

---

## 4. Full Event Flow: Interview

```
1. Frontend starts interview
   → Backend publishes interview-events:INTERVIEW_STARTED
   → WS pushes interview:started to user

2. User completes interview
   → Backend publishes interview-events:INTERVIEW_COMPLETED
   → WS pushes interview:completed to user

3. ML service consumes interview-events:INTERVIEW_COMPLETED
   → Runs scoring model
   → Publishes score-events:SCORE_UPDATED
   → Publishes interview-events:INTERVIEW_FEEDBACK_READY
   → Publishes notification-events:NOTIFICATION_CREATED

4. WebSocket server consumes:
   → score-events:SCORE_UPDATED → emits score:update to user
   → interview-events:INTERVIEW_FEEDBACK_READY → emits interview:feedback
   → notification-events:NOTIFICATION_CREATED → emits notification
```

---

## 5. Integration Checklist

For your Backend service:
- [ ] Use `shared/utils/kafkaProducer.js` to publish events
- [ ] Set consumer group ID `backend-consumer-group`
- [ ] Subscribe to `score-events`, `resume-events`, `job-events`
- [ ] After any action, publish to appropriate Kafka topic
- [ ] Generate JWT tokens with `{ userId, role }` payload

For your ML service:
- [ ] Subscribe to `interview-events` and `resume-events`
- [ ] Publish results to `score-events` and `interview-events`
- [ ] Use userId as partition key for ordering

For your Frontend:
- [ ] Use `shared/utils/cipSocketClient.js` SDK
- [ ] Pass JWT token on connect
- [ ] Handle reconnection (SDK does this automatically)
- [ ] Upload files to Storage Service API

---

## 6. Health Checks

```
GET http://localhost:3001/health  → WebSocket
GET http://localhost:3002/health  → Job Worker
GET http://localhost:3003/health  → Storage
GET http://localhost:9090         → Prometheus
GET http://localhost:3004         → Grafana
GET http://localhost:8090         → Kafka UI
```
