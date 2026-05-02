# AI Career Intelligence & Interview Coach

This repository contains a multi-service career coaching platform built around one connected flow:

`Resume -> skills -> interview coaching -> skill gaps -> job matching -> progress tracking`

The active product path has been cleaned so the real interview logic lives in the ML service, while the backend stores and aggregates results.

## Main apps

- `cip-web` - Next.js frontend
- `cip-backend` - Spring Boot backend services and persistence
- `cip-ml` - FastAPI AI/ML service
- `cip-infra` - infra support such as WebSocket and local stack pieces

## Product modules

1. `AI Interview Coach`
   Voice input, pause detection, AI question generation, answer evaluation, spoken feedback, persona mode.
2. `Skill Intelligence Engine`
   Uses resume skills and recent interview performance to detect repeated weak areas.
3. `Job Recommendation`
   Uses real job data and match scores tied to skills and readiness.
4. `Certificate Validator`
   Upload, OCR, authenticity checks, and result display.
5. `Progress Tracking`
   Honest aggregates from stored attempts and scores.

## Architecture

For the interview flow, the clean path is now:

`Frontend -> ML service (question + evaluation) -> Backend (store results) -> DB`

The backend interview service is storage-only for interview sessions and answers. It no longer owns question generation or answer scoring.

## What is already verified

These checks passed locally in this workspace:

- frontend type-check
- frontend production build
- backend Maven compile
- ML Python syntax validation

## What still needs live runtime verification

I could not honestly mark the whole system as fully runtime-validated inside this workspace because Docker was not running during the final pass. That means the complete live chain still needs one real startup run:

- browser mic -> frontend -> ML -> backend -> DB
- resume upload -> parse -> save -> reuse in interview
- certificate upload -> OCR/authenticity result
- jobs page against live backend data

## Quick start

### Prerequisites

- Docker Desktop
- Node.js 18+
- Python 3.10+
- Java 17+
- Maven 3.9+

### Frontend env

Create `cip-web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_ML_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### ML env

In PowerShell:

```powershell
$env:GEMINI_API_KEY="your-gemini-key"
$env:ELEVENLABS_API_KEY="your-elevenlabs-key"   # optional
```

### Start order

1. Start infra from `cip-infra`
2. Start `cip-ml`
3. Start backend services in `cip-backend`
4. Start `cip-web`

See:

- [QUICK-START-GUIDE.md](QUICK-START-GUIDE.md)
- [START-SERVICES-WINDOWS.md](START-SERVICES-WINDOWS.md)
- [SETUP-AND-TEST.md](SETUP-AND-TEST.md)
- [cip-web/README.md](cip-web/README.md)
- [cip-backend/API_REFERENCE.md](cip-backend/API_REFERENCE.md)

## GitHub readiness

A root `.gitignore` is included and generated junk from the main app surface has been removed. Before pushing:

1. Review local `.env` files.
2. Make sure secrets are not committed.
3. Run the live startup once with your real keys.

## Initialize git locally

```powershell
git init
git add .
git status
git commit -m "Finalize AI Career Intelligence & Interview Coach"
```
