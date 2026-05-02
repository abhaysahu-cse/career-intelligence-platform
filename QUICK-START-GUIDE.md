# Quick Start Guide

This is the shortest honest path to run the project on another machine.

## 1. Prerequisites

- Docker Desktop
- Node.js 18+
- Python 3.10+
- Java 17+
- Maven 3.9+

## 2. Configure environment

### Frontend

Create `cip-web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_ML_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### ML service

In PowerShell:

```powershell
$env:GEMINI_API_KEY="your-gemini-key"
$env:ELEVENLABS_API_KEY="your-elevenlabs-key"   # optional
```

## 3. Start infrastructure

Start the infra stack from `cip-infra` so PostgreSQL, Redis, and Kafka are available.

## 4. Start the ML service

```powershell
Set-Location cip-ml
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 5. Start the backend

```powershell
Set-Location ..\cip-backend
mvn -DskipTests package
```

Then start the needed Spring Boot services. Use [START-SERVICES-WINDOWS.md](START-SERVICES-WINDOWS.md) for the exact Windows commands.

## 6. Start the frontend

```powershell
Set-Location ..\cip-web
npm install
npm run dev
```

Open `http://localhost:3000`.

## 7. Manual validation flow

1. Upload a resume on the profile page.
2. Confirm skills appear and score data updates.
3. Open interview, allow microphone, answer a question, then pause.
4. Confirm score and feedback render and audio playback works.
5. Open jobs and confirm recommended matches appear.
6. Upload a certificate and confirm OCR and authenticity results appear.

## 8. Useful health checks

```powershell
curl http://localhost:8000/health
curl http://localhost:8080/actuator/health
curl http://localhost:3000
```

## 9. Build sanity checks

```powershell
Set-Location cip-web
npx tsc --noEmit
npm run build

Set-Location ..\cip-backend
mvn -DskipTests compile
```
