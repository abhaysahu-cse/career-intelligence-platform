# Career Intelligence Platform (CIP) - API Endpoints

This document outlines the core API endpoints across the CIP platform, verified and tested with the ML Engine and Java Microservices.

## Base URLs
- **API Gateway (Java Microservices):** `http://localhost:8080`
- **ML Engine (FastAPI):** `http://localhost:8000`
- **Frontend (Next.js):** `http://localhost:3000`

---

## 🔐 Auth Service (Port: 8081, Gateway: `/auth`)

| Method | Endpoint | Description | Payload |
|--------|---------|-------------|---------|
| `POST` | `/auth/signup` | Register a new user | `{"name":"", "email":"", "password":"", "role":"STUDENT"}` |
| `POST` | `/auth/login` | Login and get JWT | `{"email":"", "password":""}` |
| `GET` | `/auth/me` | Get current user | *Requires Bearer Token* |

---

## 📄 Resume Service (Port: 8083, Gateway: `/resume`)

| Method | Endpoint | Description | Payload |
|--------|---------|-------------|---------|
| `POST` | `/resume/upload` | Upload & parse resume via ML | `multipart/form-data` (file) |
| `GET` | `/resume/{id}` | Get parsed resume details | *None* |

---

## 🧠 ML Engine (Port: 8000, Gateway: direct)

| Method | Endpoint | Description | Payload |
|--------|---------|-------------|---------|
| `POST` | `/ml/resume/upload` | Direct resume parsing | `multipart/form-data` (file) + `student_id` |
| `POST` | `/ml/interview/question` | Generate AI interview question | `{"resume_data":{}, "job_role":""}` |
| `POST` | `/ml/interview/evaluate` | Grade AI interview answer | `{"student_id":"", "question":"", "answer_text":""}` |
| `POST` | `/ml/certificate/validate`| Parse & validate certificate | `multipart/form-data` (file) |

---

## 🎤 Interview Service (Port: 8086, Gateway: `/interview`)

| Method | Endpoint | Description | Payload |
|--------|---------|-------------|---------|
| `POST` | `/interview/start` | Start an interview session | `{"jobRole":"", "numberOfQuestions":5}` |
| `GET` | `/interview/history` | Get user interview history | *None* |

---

## 💼 Job Service (Port: 8087, Gateway: `/jobs`)

| Method | Endpoint | Description | Payload |
|--------|---------|-------------|---------|
| `GET` | `/jobs` | Get all paginated jobs | `?page=0&size=20` |
| `GET` | `/jobs/recommended` | Get AI job recommendations | `?readiness=X` |

---

## 🎓 Certificate Service (Port: 8089, Gateway: `/certificates`)

| Method | Endpoint | Description | Payload |
|--------|---------|-------------|---------|
| `POST` | `/certificates/upload` | Upload certificate for validation | `multipart/form-data` (file) |
| `GET` | `/certificates` | Get user certificates | *None* |

---

## 📊 Score & Analytics (Port: 8084/8085, Gateway: `/score` & `/analytics`)

| Method | Endpoint | Description | Payload |
|--------|---------|-------------|---------|
| `GET` | `/score` | Get student readiness score | *None* |
| `GET` | `/analytics` | Get detailed analytics | *None* |
