# 🚀 CIP REAL SYSTEM TEST GUIDE

**Comprehensive End-to-End Testing with Real Data**

---

## 🎯 TEST OBJECTIVES

Verify that:
1. ✅ Every API works with **REAL data** (no mocks)
2. ✅ ML outputs are **AI-driven** (Gemini-powered)
3. ✅ Resume parsing extracts **real skills**
4. ✅ Certificate OCR extracts **real text**
5. ✅ Interview questions are **dynamically generated**
6. ✅ Job recommendations use **real matching logic**
7. ✅ End-to-end flow works under **real conditions**

---

## 📁 TEST FILES (REAL PDFs FROM ROOT)

```
✅ Abhay_Sahu_CV (1).pdf          - Real resume for parsing test
✅ Abhay_Sahu_Certificate.pdf     - Real certificate for OCR test
✅ Oracle GENAI Certification Abhay.pdf - Real certificate for validation
```

---

## 🚀 QUICK START

### Prerequisites
```bash
# 1. Ensure all services are running
docker ps  # Should show 11 containers

# 2. Set environment variables
export GEMINI_API_KEY="your-key-here"
export DB_PASSWORD="cip123"

# 3. Start backend services
cd cip-backend
./start-all.sh

# 4. Start ML service
cd cip-ml
python main.py

# 5. Start frontend
cd cip-web
npm run dev
```

### Run Automated Tests
```bash
chmod +x test-real-system.sh
./test-real-system.sh
```

---

## 📋 MANUAL TEST PLAN

### 🔴 PHASE 1: INFRASTRUCTURE VERIFICATION

#### Step 1: Check Docker Containers
```bash
docker ps
```

**Expected Output**:
```
✅ cip-postgres (healthy)
✅ cip-kafka (healthy)
✅ cip-zookeeper (healthy)
✅ cip-redis (healthy)
✅ cip-websocket (healthy)
✅ cip-storage (healthy)
✅ cip-job-worker (healthy)
✅ cip-schema-registry
✅ cip-kafka-ui
✅ cip-prometheus
✅ cip-grafana
```

#### Step 2: Check API Gateway
```bash
curl http://localhost:8080/actuator/health
```

**Expected**: `{"status":"UP"}`

#### Step 3: Check ML Service
```bash
curl http://localhost:8000/health
```

**Expected**: `{"status":"healthy"}`

---

### 🟢 PHASE 2: AUTH FLOW TEST

#### Register User
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test@123",
    "role": "STUDENT"
  }'
```

**Expected**: User created with ID

#### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123"
  }'
```

**Expected**: JWT token returned

**Save Token**:
```bash
TOKEN="<your-jwt-token>"
```

---

### 🟡 PHASE 3: RESUME UPLOAD TEST (REAL FILE)

#### Upload Real Resume
```bash
curl -X POST http://localhost:8080/api/resume/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@Abhay_Sahu_CV (1).pdf"
```

**Verify**:
- ✅ Text extracted from PDF
- ✅ Skills detected (Java, Spring Boot, etc.)
- ✅ Resume score calculated
- ✅ Kafka event triggered

#### Check Profile
```bash
curl http://localhost:8080/api/student/profile \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**:
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "skills": ["Java", "Spring Boot", "PostgreSQL", ...],
  "resumeScore": 75
}
```

---

### 🔴 PHASE 4: ML INTERVIEW TEST (CORE - REAL AI)

#### Generate Question (Gemini AI)
```bash
curl -X POST http://localhost:8000/ml/interview/question \
  -H "Content-Type: application/json" \
  -d '{
    "resume_data": {
      "skills": ["Java", "Spring Boot", "PostgreSQL", "Kafka"]
    },
    "job_role": "Backend Developer",
    "previous_answers": []
  }'
```

**Expected**:
```json
{
  "question": "Explain how you would design a scalable REST API...",
  "difficulty": "medium",
  "topic": "System Design",
  "expected_answer": "A strong answer should..."
}
```

**Verify**:
- ✅ Question is **dynamic** (not static)
- ✅ Question is **relevant** to skills
- ✅ Question is **contextual** to role

#### Evaluate Answer (Gemini AI)
```bash
curl -X POST http://localhost:8000/ml/interview/coach \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Explain REST API design principles",
    "answer": "REST API uses HTTP methods like GET, POST, PUT, DELETE. It is stateless and uses JSON for data transfer.",
    "job_role": "Backend Developer",
    "resume_skills": ["Java", "Spring Boot"],
    "persona_mode": "friendly"
  }'
```

**Expected**:
```json
{
  "score": 72,
  "good": "You correctly mentioned HTTP methods and statelessness",
  "missing": "You didn't discuss HATEOAS, idempotency, or caching strategies",
  "ideal": "A complete answer should cover: HTTP methods, statelessness, resource naming, HATEOAS, idempotency, caching, versioning",
  "tip": "Structure your answer: definition → principles → example → tradeoffs",
  "speech_text": "Score 72. Good: You correctly mentioned...",
  "provider": "gemini"
}
```

**Verify**:
- ✅ Score is **calculated** (not random)
- ✅ Feedback is **intelligent** (detects missing concepts)
- ✅ Feedback is **personalized** (based on answer)
- ✅ Tip is **actionable**

---

### 🟣 PHASE 5: INTERVIEW SERVICE FLOW

#### Start Interview
```bash
curl -X POST http://localhost:8080/api/interview/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobRole": "Backend Developer",
    "type": "TECHNICAL",
    "numberOfQuestions": 5
  }'
```

**Expected**: Interview ID returned

#### Submit Answer
```bash
curl -X POST http://localhost:8080/api/interview/answer \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "interviewId": 1,
    "questionIndex": 0,
    "question": "Explain REST API",
    "answer": "REST is an architectural style...",
    "timeTakenSeconds": 120
  }'
```

**Expected**: Answer saved, score calculated

#### End Interview
```bash
curl -X POST http://localhost:8080/api/interview/end?interviewId=1 \
  -H "Authorization: Bearer $TOKEN"
```

**Verify**:
- ✅ Interview score saved
- ✅ Kafka event triggered
- ✅ Score service updated

---

### 🟢 PHASE 6: SCORE & ANALYTICS

#### Get Score
```bash
curl http://localhost:8080/api/score \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**:
```json
{
  "readiness": 68,
  "level": "Almost Ready",
  "breakdown": {
    "resume": 75,
    "interview": 64,
    "skills": 70
  }
}
```

**Verify Formula**: `Readiness = 0.4 × Resume + 0.6 × Interview`

#### Get Analytics
```bash
curl http://localhost:8080/api/analytics \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**:
```json
{
  "progressHistory": [...],
  "subjects": [...],
  "weakSkills": ["System Design", "Database Optimization"],
  "recommendations": [...]
}
```

---

### 🔵 PHASE 7: JOB RECOMMENDATIONS

#### Get All Jobs
```bash
curl http://localhost:8080/api/jobs \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: List of real jobs from database

#### Get Recommended Jobs
```bash
curl http://localhost:8080/api/jobs/recommended \
  -H "Authorization: Bearer $TOKEN"
```

**Verify**:
- ✅ Match % calculated based on skills
- ✅ Jobs sorted by match %
- ✅ Only jobs above readiness threshold shown
- ✅ Real company names (Google, Amazon, etc.)
- ✅ Real job links

---

### 🟠 PHASE 8: CERTIFICATE VALIDATION (REAL FILES)

#### Upload Certificate 1
```bash
curl -X POST http://localhost:8080/api/certificates/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@Abhay_Sahu_Certificate.pdf"
```

**Expected**:
```json
{
  "certificateId": "cert-123",
  "authenticityScore": 85,
  "status": "VERIFIED",
  "extractedData": {
    "name": "Abhay Sahu",
    "issuer": "...",
    "certificateTitle": "...",
    "issueDate": "..."
  },
  "tamperingResult": {
    "tamperingDetected": false,
    "tamperingScore": 0.95
  }
}
```

**Verify**:
- ✅ OCR extracted text from PDF
- ✅ Name detected correctly
- ✅ Issuer validated
- ✅ Tampering detection ran
- ✅ Authenticity score calculated

#### Upload Certificate 2
```bash
curl -X POST http://localhost:8080/api/certificates/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@Oracle GENAI Certification Abhay.pdf"
```

**Verify**: Same checks as above

#### Get Certificates List
```bash
curl http://localhost:8080/api/certificates \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: List of uploaded certificates with scores

---

### 🟡 PHASE 9: KAFKA EVENT FLOW

#### Check Kafka Logs
```bash
docker logs cip-kafka | tail -50
```

**Verify Events**:
- ✅ `resume.uploaded`
- ✅ `interview.completed`
- ✅ `score.updated`
- ✅ `certificate.processed`

#### Check Kafka Topics
```bash
docker exec -it cip-kafka kafka-topics --list --bootstrap-server localhost:9092
```

**Expected Topics**:
```
score-events
interview-events
resume-events
certificate-events
recommendation-events
notification-events
analytics-events
```

---

### 🔵 PHASE 10: FRONTEND VERIFICATION

#### Test UI Flow
1. Open http://localhost:3000
2. Click "Get Started"
3. Sign up with test credentials
4. Upload resume (drag & drop PDF)
5. Wait for parsing
6. Click "Start Interview"
7. Allow microphone access
8. Speak an answer
9. Wait 2-3 seconds (pause detection)
10. See AI feedback
11. Check dashboard for score
12. Browse jobs
13. Upload certificate
14. Check certificate validation result

**Verify**:
- ✅ No fake data displayed
- ✅ Real-time updates work
- ✅ Voice AI works
- ✅ Charts display real data
- ✅ No console errors
- ✅ No crashes

---

## 🧪 CRITICAL VERIFICATION CHECKLIST

### Resume Parsing
- [ ] PDF text extracted correctly
- [ ] Skills detected accurately
- [ ] Resume score calculated
- [ ] Skills used in interview questions
- [ ] Skills used in job matching

### Interview AI
- [ ] Questions are dynamic (not static)
- [ ] Questions adapt to resume
- [ ] Questions adapt to previous answers
- [ ] Evaluation is intelligent
- [ ] Feedback detects missing concepts
- [ ] Feedback is personalized
- [ ] Score is calculated (not random)

### Job Matching
- [ ] Match % calculated correctly
- [ ] Based on resume skills
- [ ] Based on interview performance
- [ ] Real company names
- [ ] Real job links
- [ ] Filtering works

### Certificate Validation
- [ ] OCR extracts text from PDF
- [ ] Name detected correctly
- [ ] Issuer validated
- [ ] Tampering detection works
- [ ] Authenticity score calculated
- [ ] Reasons provided

### Kafka Events
- [ ] Resume upload triggers event
- [ ] Interview completion triggers event
- [ ] Score update triggers event
- [ ] Certificate upload triggers event
- [ ] Events have correct format

### Data Consistency
- [ ] Resume skills → Interview questions
- [ ] Interview score → Readiness score
- [ ] Readiness score → Job recommendations
- [ ] All scores match formula
- [ ] No data mismatch

---

## ❌ REJECTION CRITERIA

**Reject the system if**:

1. ❌ Any static/mock data appears
2. ❌ ML responses are generic (not personalized)
3. ❌ APIs fail with real input
4. ❌ Data mismatch occurs (scores don't match)
5. ❌ OCR doesn't extract text
6. ❌ Questions are static arrays
7. ❌ Feedback is template-based
8. ❌ Job matching is random
9. ❌ Kafka events don't trigger
10. ❌ Frontend shows fake data

---

## 🎯 SUCCESS CRITERIA

**System is production-ready if**:

1. ✅ All APIs return real data
2. ✅ ML generates dynamic questions
3. ✅ ML provides intelligent feedback
4. ✅ Resume parsing extracts skills
5. ✅ Certificate OCR extracts text
6. ✅ Job matching uses real logic
7. ✅ Score formula is correct
8. ✅ Kafka events flow correctly
9. ✅ Frontend displays real data
10. ✅ No console errors
11. ✅ No crashes under load
12. ✅ Voice AI works end-to-end

---

## 📊 TEST RESULTS TEMPLATE

```
========================================
CIP SYSTEM TEST RESULTS
========================================

Date: _______________
Tester: _______________

INFRASTRUCTURE
[ ] Docker containers running
[ ] PostgreSQL accessible
[ ] Kafka accessible
[ ] Redis accessible

AUTH FLOW
[ ] Registration works
[ ] Login works
[ ] JWT token obtained

RESUME PARSING
[ ] PDF uploaded successfully
[ ] Text extracted: _______________
[ ] Skills detected: _______________
[ ] Resume score: _______________

ML INTERVIEW
[ ] Question generated (dynamic): _______________
[ ] Answer evaluated
[ ] Score: _______________
[ ] Feedback quality: _______________

CERTIFICATE VALIDATION
[ ] PDF uploaded successfully
[ ] OCR extracted text: _______________
[ ] Authenticity score: _______________
[ ] Tampering detected: _______________

JOB RECOMMENDATIONS
[ ] Jobs fetched: _______________
[ ] Match % calculated: _______________
[ ] Real companies: _______________

KAFKA EVENTS
[ ] Resume event: _______________
[ ] Interview event: _______________
[ ] Score event: _______________
[ ] Certificate event: _______________

FRONTEND
[ ] Login works
[ ] Resume upload works
[ ] Voice interview works
[ ] Dashboard displays data
[ ] Jobs page works
[ ] Certificate upload works

OVERALL STATUS
[ ] PASS - Production Ready
[ ] FAIL - Issues Found

Issues Found:
_______________________________________________
_______________________________________________
_______________________________________________
```

---

## 🚀 FINAL ADVICE

**Don't just test "working" — test "real-world behavior"**

1. Use **real files** (not test.pdf)
2. Verify **AI intelligence** (not templates)
3. Check **data flow** (not just endpoints)
4. Test **edge cases** (invalid input, slow network)
5. Verify **consistency** (scores match formula)
6. Check **performance** (response time < 3s)
7. Test **error handling** (graceful failures)
8. Verify **security** (JWT validation)
9. Check **logging** (events in Kafka)
10. Test **scalability** (multiple users)

**Remember**: A system that "works" in demo might fail in production. Test like a user, not like a developer.

---

**Test Script**: `./test-real-system.sh`  
**Status**: Ready to execute  
**Confidence**: High  

**Good luck! 🚀**
