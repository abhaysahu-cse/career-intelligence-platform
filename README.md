# 🚀 Career Intelligence Platform (CIP)

> **AI-powered career readiness system for students** — Real-time voice interview coaching, smart resume analysis, job matching, and certificate validation.

[![Java](https://img.shields.io/badge/Java-21-orange)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-green)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://python.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5-purple)](https://ai.google.dev/)

---

## 🎯 What It Does

CIP is a **full-stack AI platform** that helps students prepare for job interviews and track career readiness through:

| Feature | Description |
|---|---|
| 🎤 **AI Voice Interview** | Real-time speech-to-text → AI evaluation → spoken feedback loop |
| 📄 **Resume Analyzer** | PDF/DOCX parsing → skill extraction → gap analysis |
| 📊 **Career Dashboard** | Readiness score, radar charts, percentile tracking |
| 💼 **Job Matcher** | Skill-based job recommendations with match % |
| 🏆 **Certificate Validator** | Upload & validate professional certificates |
| 🗺️ **Learning Roadmap** | AI-generated study plans based on weak areas |
| 🤖 **AI Interview Mentor** | Follow-up chat with context-aware coaching |

---

## 🏗️ Architecture (v1.0 — Full Microservices)

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Next.js 14  │────▶│ API Gateway  │────▶│  Microservices   │
│  (Port 3000) │     │  (Port 8080) │     │  (8081–8089)     │
└─────────────┘     └──────────────┘     └──────────────────┘
                           │
                    ┌──────┴──────┐
                    │  FastAPI ML  │
                    │  (Port 8000) │
                    └─────────────┘

Infrastructure: PostgreSQL · Redis · Kafka · Docker
```

### Backend Services (Java 21 / Spring Boot 3.2)

| Service | Port | Purpose |
|---|---|---|
| `api-gateway` | 8080 | Routing, JWT validation, rate limiting |
| `auth-service` | 8081 | Login, signup, OTP, JWT tokens |
| `student-service` | 8082 | Student profiles, admin panel |
| `resume-service` | 8083 | Resume upload, PDF/DOCX parsing |
| `score-service` | 8084 | Composite readiness scoring |
| `analytics-service` | 8085 | Progress tracking, percentiles |
| `interview-service` | 8086 | Interview session management |
| `job-service` | 8087 | Job listings, skill-based matching |
| `recommendation-service` | 8088 | Roadmaps, job recommendations |
| `certificate-service` | 8089 | Certificate upload & validation |

### ML Engine (Python / FastAPI)

| Endpoint | Purpose |
|---|---|
| `/ml/resume/upload` | Resume parsing + skill extraction |
| `/ml/interview/question` | AI question generation (Gemini) |
| `/ml/interview/coach` | Answer evaluation + voice feedback |
| `/ml/interview/coach` (chat) | Follow-up mentor chat |
| `/ml/readiness` | Career readiness computation |
| `/ml/recommend` | Job recommendation scoring |
| `/ml/certificate/validate` | Certificate authenticity check |

### Frontend (Next.js 14 / TypeScript / Tailwind)

- Dashboard with readiness gauge & radar chart
- Real-time AI voice interview with avatar
- Profile with resume upload & skill tags
- Job board with match percentages
- Certificate manager with validation
- Learning roadmap generator

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Java 21, Maven 3.9+, Node.js 18+, Python 3.11+
- Docker Desktop (for PostgreSQL, Redis, Kafka)
- Gemini API Key

### 1. Infrastructure
```bash
docker-compose -f cip-infra/docker-compose.yml up -d
```

### 2. Backend (build all services)
```bash
cd cip-backend && mvn clean install -DskipTests
# Then start each service JAR individually or use start_cip.bat
```

### 3. ML Engine
```bash
cd cip-ml && pip install -r requirements.txt
# Set GEMINI_API_KEY in .env
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Frontend
```bash
cd cip-web && npm install && npm run dev
```

Open **http://localhost:3000**

---

## 🔑 Environment Variables

| Variable | Where | Example |
|---|---|---|
| `DB_PASSWORD` | Backend services | `cip123` |
| `DB_PORT` | Backend services | `5433` |
| `REDIS_PASSWORD` | Backend services | `cip-redis-pass` |
| `GEMINI_API_KEY` | ML Engine `.env` | `AIza...` |
| `ELEVENLABS_API_KEY` | ML Engine `.env` | (optional, for TTS) |

---

## 📁 Project Structure

```
career-intelligence-platform/
├── cip-backend/          # Java microservices (Maven multi-module)
│   ├── api-gateway/      # Spring Cloud Gateway
│   ├── auth-service/     # Authentication & JWT
│   ├── student-service/  # Student profiles
│   ├── resume-service/   # Resume processing
│   ├── score-service/    # Score aggregation
│   ├── analytics-service/# Progress analytics
│   ├── interview-service/# Interview sessions
│   ├── job-service/      # Job management
│   ├── recommendation-service/ # Roadmaps
│   ├── certificate-service/    # Certificates
│   └── common-lib/       # Shared DTOs, configs
├── cip-ml/               # Python FastAPI ML engine
│   ├── main.py           # All ML endpoints
│   └── services/         # Resume, interview, cert engines
├── cip-web/              # Next.js 14 frontend
│   ├── app/              # App router pages
│   ├── components/       # Reusable UI components
│   ├── lib/              # API client, utilities
│   └── store/            # Zustand state management
├── cip-infra/            # Docker Compose, Kafka, monitoring
├── API_ENDPOINTS.md      # Complete API reference
├── start_cip.bat         # Windows startup script
└── run_e2e_tests.py      # End-to-end test suite
```

---

## 👤 Author

**Abhay Sahu** — Computer Science & Engineering  
Built as a capstone project demonstrating full-stack AI engineering, microservices architecture, and real-time ML integration.

---

## 📜 License

This project is for educational and portfolio purposes.
