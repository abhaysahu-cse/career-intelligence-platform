# CIP Infrastructure — Team 2

> **The nervous system of the Career Intelligence Platform.**
> Event-driven, real-time, scalable to thousands of users.

---

## Architecture

```
Services → Kafka → Consumers → ML → Kafka → Backend → WebSocket → Frontend
```

```
┌─────────────┐    ┌──────────────────────────────────┐    ┌──────────────┐
│  Frontend   │◄───│       WebSocket Server            │◄───│    Kafka     │
│  (React)    │    │       Socket.IO / JWT Auth        │    │   Broker     │
└─────────────┘    └──────────────────────────────────┘    └──────┬───────┘
                                                                   │
┌─────────────┐    ┌──────────────────────────────────┐    ┌──────▼───────┐
│  ML Service │───►│    Kafka Topics                  │    │  Zookeeper   │
│  (yours)    │    │  student / resume / interview    │    └──────────────┘
└─────────────┘    │  score / job / notification      │
                   └──────────────────────────────────┘
┌─────────────┐           ▲              │
│  Backend    │───────────┘              ▼
│  (yours)    │    ┌──────────────────────────────────┐
└─────────────┘    │       Job Worker                 │
                   │  Greenhouse + Lever + Ashby APIs  │
┌─────────────┐    │  Cron scheduler (every 15 min)   │
│  Storage    │    └──────────────────────────────────┘
│  S3 / Local │
└─────────────┘
```

---

## Quick Start

```bash
# 1. Clone / unzip
cd cip-infra

# 2. Configure environment
cp .env.example .env
# Edit .env as needed (defaults work for local dev)

# 3. Start everything
chmod +x scripts/start.sh
./scripts/start.sh

# OR simply:
docker-compose up
```

That's it. All services start automatically.

---

## Services

| Service | URL | Description |
|---------|-----|-------------|
| WebSocket | `ws://localhost:3001` | Real-time push to frontend |
| Storage API | `http://localhost:3003` | File upload/download |
| Kafka UI | `http://localhost:8090` | Browse topics & messages |
| Prometheus | `http://localhost:9090` | Metrics |
| Grafana | `http://localhost:3004` | Dashboards (admin/admin123) |
| Schema Registry | `http://localhost:8081` | Event schemas |

---

## Project Structure

```
cip-infra/
├── docker-compose.yml          ← Start everything
├── .env.example                ← Config template
├── kafka/
│   └── init-scripts/
│       └── create-topics.sh   ← Creates all 6 topics + DLQs
├── websocket/                  ← Node.js Socket.IO server
│   ├── Dockerfile
│   └── src/
│       ├── index.js            ← Entry point
│       ├── socket.js           ← Connection & auth
│       ├── metrics.js          ← Prometheus metrics
│       └── kafka/
│           └── consumer.js     ← Kafka → WebSocket routing
├── job-worker/                 ← Job ingestion + scheduling
│   ├── Dockerfile
│   └── src/
│       ├── index.js
│       ├── fetchers/
│       │   ├── greenhouse.js   ← Greenhouse Harvest API
│       │   ├── lever.js        ← Lever API
│       │   ├── ashby.js        ← Ashby API
│       │   └── jobIngestion.js ← Dedup + Kafka publish
│       ├── producers/
│       │   └── kafkaProducer.js
│       ├── consumers/
│       │   └── index.js        ← Listens to student/resume events
│       └── schedulers/
│           └── jobScheduler.js ← Cron: fetch, recalc, cleanup
├── storage-service/            ← File storage (S3 + local)
│   ├── Dockerfile
│   └── src/
│       ├── index.js
│       ├── routes/
│       │   ├── upload.js       ← POST /upload/resume
│       │   └── fetch.js        ← GET /signed-url, DELETE
│       ├── storage/
│       │   └── provider.js     ← S3 + local abstraction
│       └── middleware/
│           └── auth.js
├── shared/
│   ├── schemas/
│   │   └── events.js           ← All event type definitions
│   └── utils/
│       ├── kafkaProducer.js    ← Reusable Kafka producer
│       └── cipSocketClient.js  ← Frontend SDK
├── monitoring/
│   └── prometheus/
│       └── prometheus.yml
├── docs/
│   └── API.md                  ← Full API documentation
└── scripts/
    ├── start.sh
    └── stop.sh
```

---

## Kafka Topics

| Topic | Partitions | Who Produces | Who Consumes |
|-------|-----------|-------------|--------------|
| `student-events` | 3 | Backend | Job Worker, ML |
| `resume-events` | 3 | Backend, ML | Backend, ML, WS |
| `interview-events` | 3 | Backend, ML | ML, WS |
| `score-events` | 3 | ML, Job Worker | Backend, WS |
| `job-events` | 6 | Job Worker | Backend, WS |
| `notification-events` | 3 | Backend, ML | WS |

Each topic has a `.dlq` (dead-letter queue) for failed events.

---

## Integration with Other Teams

**Your Backend needs to:**
1. Copy `shared/utils/kafkaProducer.js` and publish events after each action
2. Subscribe to `score-events`, `resume-events`, `job-events`
3. Generate JWT tokens with `{ userId, role }` — same secret as `JWT_SECRET` in `.env`

**Your ML Service needs to:**
1. Subscribe to `interview-events:INTERVIEW_COMPLETED`
2. Publish `score-events:SCORE_UPDATED` + `interview-events:INTERVIEW_FEEDBACK_READY`
3. Subscribe to `resume-events:RESUME_PARSE_REQUESTED`
4. Publish `resume-events:RESUME_PARSED`

**Your Frontend needs to:**
1. Copy `shared/utils/cipSocketClient.js`
2. Connect with JWT: `new CIPSocketClient({ token, serverUrl: "http://localhost:3001" })`
3. Call `client.onScoreUpdate(handler)`, `client.onInterviewFeedback(handler)`, etc.

---

## Environment Variables

See `.env.example` for full reference. Minimum required for local dev:
```env
JWT_SECRET=any-secret-string
STORAGE_TYPE=local
```

For production with S3 and real ATS APIs:
```env
JWT_SECRET=<long-random-secret>
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=cip-resumes
GREENHOUSE_API_KEY=...
LEVER_API_KEY=...
ASHBY_API_KEY=...
```

---

## Stop Everything

```bash
./scripts/stop.sh
# or
docker-compose down

# Remove volumes too (fresh start):
docker-compose down -v
```
