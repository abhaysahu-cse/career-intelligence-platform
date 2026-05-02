# CIP Web

Frontend for the `AI Career Intelligence & Interview Coach`.

## What is real here

- Auth uses the backend gateway.
- Resume upload goes to `/resume/upload`.
- Voice interview uses the browser Web Speech API plus the ML service for:
  - next-question generation
  - answer evaluation
  - spoken coaching
- Jobs page reads real backend jobs and real recommended matches.
- Progress page reads real aggregates from scores and stored interview attempts.

## Local setup

1. Install dependencies

```bash
npm install
```

2. Create `.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_ML_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

3. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Notes

- For live voice capture, use a browser with Web Speech API support.
- If ElevenLabs is not configured, spoken coaching falls back to browser speech synthesis.
- Real-time socket metrics are not faked anymore; if the socket server is unavailable, the UI shows that honestly.
