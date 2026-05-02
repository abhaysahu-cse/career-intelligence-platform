"""
CIP ML Platform - Main FastAPI Application
All ML modules exposed as REST APIs.
"""
import base64
import json
import os
import sys
import time
from typing import Optional

import httpx
import uvicorn
from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.models import (  # noqa: E402
    CareerReadinessRequest,
    CareerReadinessResponse,
    InterviewEvaluateRequest,
    InterviewEvaluateResponse,
    InterviewQuestionRequest,
    InterviewQuestionResponse,
    RecommendRequest,
    RecommendResponse,
    ResumeAnalyzeRequest,
    ResumeAnalyzeResponse,
)
from services.career_readiness.engine import compute_readiness, recommend_jobs  # noqa: E402
from services.interview_evaluator.engine import evaluate_interview  # noqa: E402
from services.resume_analyzer.engine import analyze_resume  # noqa: E402

try:
    import google.generativeai as genai  # type: ignore
except Exception:
    genai = None


ROLE_TOPICS = {
    "frontend": ["React", "JavaScript", "Browser APIs", "Performance", "CSS"],
    "backend": ["System Design", "Database", "API Design", "Concurrency", "Caching"],
    "devops": ["Docker", "Kubernetes", "CI/CD", "Cloud", "Observability"],
    "data": ["SQL", "Python", "Statistics", "Data Modeling", "ETL"],
    "sde": ["DSA", "OOP", "System Design", "Database", "OS"],
    "software": ["DSA", "OOP", "System Design", "Database", "OS"],
}

ROLE_QUESTION_BANK = {
    "frontend": [
        {"topic": "React", "difficulty": "medium", "question": "How would you structure a large React screen so state, rendering, and data fetching stay maintainable?"},
        {"topic": "JavaScript", "difficulty": "easy", "question": "Explain closures with a practical bug or interview example."},
        {"topic": "Performance", "difficulty": "medium", "question": "What would you check first if a React page becomes sluggish after adding more components?"},
        {"topic": "Browser APIs", "difficulty": "medium", "question": "How does the event loop affect UI responsiveness in a browser app?"},
    ],
    "backend": [
        {"topic": "System Design", "difficulty": "hard", "question": "Design a scalable interview evaluation service that accepts answers, evaluates them, and stores results."},
        {"topic": "Database", "difficulty": "medium", "question": "How do you choose indexes for a write-heavy application without hurting performance too much?"},
        {"topic": "API Design", "difficulty": "medium", "question": "Design an API for submitting interview answers and returning structured feedback."},
        {"topic": "Caching", "difficulty": "medium", "question": "Where would you cache data in a job recommendation platform, and how would you handle stale results?"},
    ],
    "devops": [
        {"topic": "Docker", "difficulty": "easy", "question": "How would you containerize a multi-service application for local development?"},
        {"topic": "Kubernetes", "difficulty": "hard", "question": "How would you roll out a new backend service version with near-zero downtime?"},
        {"topic": "CI/CD", "difficulty": "medium", "question": "What checks must run before deploying an interview platform to production?"},
        {"topic": "Observability", "difficulty": "medium", "question": "How would you debug intermittent failures across frontend, backend, Kafka, and ML services?"},
    ],
    "data": [
        {"topic": "SQL", "difficulty": "medium", "question": "How would you rank candidates against jobs using skill overlap in SQL?"},
        {"topic": "Python", "difficulty": "easy", "question": "How would you structure a Python service for resume parsing and inference?"},
        {"topic": "Data Modeling", "difficulty": "medium", "question": "How would you model students, resumes, interviews, and jobs for analytics and matching?"},
        {"topic": "Statistics", "difficulty": "medium", "question": "What metrics would you use to decide whether interview scores are actually improving?"},
    ],
    "sde": [
        {"topic": "DSA", "difficulty": "easy", "question": "When would you choose a hash map, heap, or balanced tree? Compare time and space tradeoffs."},
        {"topic": "OOP", "difficulty": "medium", "question": "How would you model an interview platform using classes, interfaces, and separation of concerns?"},
        {"topic": "System Design", "difficulty": "hard", "question": "Design a resume-aware AI interview coach that supports voice input and structured feedback."},
        {"topic": "Database", "difficulty": "medium", "question": "How would you store interview attempts and still query progress trends efficiently?"},
        {"topic": "OS", "difficulty": "medium", "question": "Explain process vs thread, and give one production issue where the distinction matters."},
    ],
}


def _get_gemini_model():
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key or genai is None:
        return None
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-1.5-flash"))


def _json_from_response(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1]
        cleaned = cleaned.rsplit("```", 1)[0]
    return json.loads(cleaned)


def _normalize_skills(resume_data: dict) -> list[str]:
    skills = resume_data.get("skills") or resume_data.get("skill_details") or []
    if skills and isinstance(skills[0], dict):
        return [str(item.get("name", "")).strip() for item in skills if str(item.get("name", "")).strip()]
    return [str(item).strip() for item in skills if str(item).strip()]


def _role_key(job_role: str) -> str:
    normalized = (job_role or "sde").lower()
    return next((key for key in ROLE_TOPICS if key in normalized), "sde")


def _weak_topics(previous_answers: list) -> list[str]:
    topics: list[str] = []
    for item in previous_answers[-3:]:
        accuracy = getattr(item, "accuracy", None)
        topic = getattr(item, "topic", None)
        if accuracy is not None and accuracy < 65 and topic:
            topics.append(topic)
    return topics


def _persona_instruction(persona_mode: str) -> str:
    persona = (persona_mode or "friendly").lower()
    if persona == "strict":
        return "Tone: strict, concise, demanding, and professional."
    if persona == "faang":
        return "Tone: FAANG-level technical interviewer. Prioritize correctness, edge cases, complexity, tradeoffs, and scale."
    return "Tone: friendly, concise, supportive, and direct."


def _fallback_question(resume_data: dict, job_role: str, previous_answers: list) -> dict:
    skills = _normalize_skills(resume_data)
    role_key = _role_key(job_role)
    role_topics = ROLE_TOPICS[role_key]
    weak_topics = _weak_topics(previous_answers)
    asked_topics = {getattr(item, "topic", None) for item in previous_answers if getattr(item, "topic", None)}
    role_bank = ROLE_QUESTION_BANK.get(role_key, ROLE_QUESTION_BANK["sde"])

    preferred_bank = [
        item for item in role_bank
        if item["topic"] in weak_topics or item["topic"] not in asked_topics
    ] or role_bank
    selected_bank_item = preferred_bank[len(previous_answers) % len(preferred_bank)]

    topic_pool = weak_topics + [
        topic for topic in role_topics
        if topic.lower() not in {skill.lower() for skill in skills} or topic not in asked_topics
    ] + role_topics
    topic = topic_pool[len(previous_answers) % len(topic_pool)]

    difficulty = "easy"
    if len(previous_answers) >= 2:
        recent = [item.accuracy for item in previous_answers[-2:] if getattr(item, "accuracy", None) is not None]
        average = sum(recent) / len(recent) if recent else 70
        difficulty = "hard" if average >= 78 else "medium" if average >= 55 else "easy"

    skill_context = ", ".join(skills[:5]) or "recent projects"
    templates = {
        "DSA": f"For a {job_role} interview, explain when you would choose a hash map, heap, or balanced tree. Include time and space tradeoffs.",
        "System Design": f"Design a small scalable service relevant to a {job_role}. Cover API, storage, caching, failures, and one bottleneck.",
        "Database": "How would you design indexes and transactions so a SQL-backed feature stays fast without breaking consistency?",
        "OOP": f"Describe how you would model a project from your resume using classes, interfaces, and encapsulation. What would you avoid?",
        "OS": "Explain process vs thread and connect it to a concurrency bug you might hit in production.",
        "React": f"Based on your skills in {skill_context}, how would you prevent unnecessary renders and keep a complex React page maintainable?",
        "JavaScript": "Explain closures and the event loop, then describe one real bug each can cause.",
        "API Design": "Design an API for submitting and evaluating interview answers. Include payload shape, validation, and error handling.",
        "Caching": "Where would you add caching in a job matching system, and how would you avoid stale results?",
        "Docker": "How would you containerize this application for local development and production?",
        "Kubernetes": "How would you roll out a new interview service version with zero downtime?",
        "SQL": "How would you rank candidates whose skills overlap best with a job's required skills?",
        "Python": "How would you structure a Python service that extracts resume skills and serves them to other services?",
    }
    question = templates.get(topic, selected_bank_item["question"])
    if skills:
        question = f"{question} Connect your answer to the candidate's background in {skill_context} when relevant."
    expected_answer = (
        f"A strong answer should define {topic}, connect it to {job_role}, discuss tradeoffs, "
        "include a concrete example, and mention complexity or edge cases where relevant."
    )
    return {
        "question": question,
        "difficulty": difficulty,
        "topic": topic,
        "expected_answer": expected_answer,
    }


def _generate_question(resume_data: dict, job_role: str, previous_answers: list, persona_mode: str) -> dict:
    fallback = _fallback_question(resume_data, job_role, previous_answers)
    model = _get_gemini_model()
    if model is None:
        return fallback

    skills = _normalize_skills(resume_data)
    role_key = _role_key(job_role)
    role_bank = ROLE_QUESTION_BANK.get(role_key, ROLE_QUESTION_BANK["sde"])
    seed_questions = [
        f"- [{item['difficulty']}] {item['topic']}: {item['question']}"
        for item in role_bank[:6]
    ]
    prompt = f"""You are generating the next interview question.
{_persona_instruction(persona_mode)}

Role: {job_role}
Resume Skills: {", ".join(skills[:10]) or "general programming"}
Weak Topics From Last 3 Answers: {", ".join(_weak_topics(previous_answers)) or "none"}
Questions Already Asked: {len(previous_answers)}
Role Question Bank:
{chr(10).join(seed_questions)}

Return JSON only:
{{
  "question": "string",
  "difficulty": "easy|medium|hard",
  "topic": "string",
  "expected_answer": "short structured outline"
}}

Constraints:
- One question only
- Technical and realistic
- Start from the role question bank, then refine it using the resume context
- Use resume context when relevant
- Prefer repeated weak areas
- Answerable in under 2 minutes
"""
    try:
        response = model.generate_content(prompt)
        payload = _json_from_response(response.text)
        if not all(key in payload for key in ["question", "difficulty", "topic"]):
            return fallback
        if "expected_answer" not in payload:
            payload["expected_answer"] = fallback["expected_answer"]
        return payload
    except Exception:
        return fallback


def _heuristic_feedback(question: str, answer: str, expected_answer: str, topic: str) -> dict:
    base = evaluate_interview({
        "student_id": "realtime",
        "question": question,
        "answer_text": answer,
        "expected_answer": expected_answer,
        "domain": topic,
        "difficulty": "Medium",
        "audio_features": None,
    })
    return {
        "score": round(base["overall_score"]),
        "good": "; ".join(base["strengths"][:2]) or "You answered directly.",
        "missing": "; ".join(base["key_concepts_missing"][:3]) or "Add deeper tradeoffs or edge cases.",
        "ideal": base["model_answer_hint"],
        "tip": base["improvements"][0] if base["improvements"] else "Use a clearer structure: definition, approach, tradeoff, example.",
    }


def _evaluate_with_gemini(question: str, answer: str, skills: list[str], persona_mode: str) -> Optional[dict]:
    model = _get_gemini_model()
    if model is None:
        return None

    prompt = f"""You are a strict technical interviewer.
{_persona_instruction(persona_mode)}

Evaluate this answer.

Question: {question}
Answer: {answer}
Skills: {", ".join(skills[:12]) or "unknown"}

Return JSON only:
{{
  "score": 72,
  "good": "short string",
  "missing": "short string",
  "ideal": "short structured answer",
  "tip": "short string"
}}

Keep it short and actionable.
"""
    try:
        response = model.generate_content(prompt)
        payload = _json_from_response(response.text)
        if not all(key in payload for key in ["score", "good", "missing", "ideal", "tip"]):
            return None
        return payload
    except Exception:
        return None


async def _tts_with_elevenlabs(text: str, persona_mode: str) -> Optional[dict]:
    api_key = os.getenv("ELEVENLABS_API_KEY")
    voice_id = os.getenv("ELEVENLABS_VOICE_ID")
    if not api_key or not voice_id:
        return None

    voice_settings = {
        "strict": {"stability": 0.45, "similarity_boost": 0.75},
        "faang": {"stability": 0.35, "similarity_boost": 0.8},
        "friendly": {"stability": 0.65, "similarity_boost": 0.75},
    }.get((persona_mode or "friendly").lower(), {"stability": 0.6, "similarity_boost": 0.75})

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers={
                "xi-api-key": api_key,
                "accept": "audio/mpeg",
                "content-type": "application/json",
            },
            json={
                "text": text,
                "model_id": os.getenv("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2"),
                "voice_settings": voice_settings,
            },
        )
        response.raise_for_status()
        return {
            "provider": "elevenlabs",
            "mime_type": "audio/mpeg",
            "audio_base64": base64.b64encode(response.content).decode("ascii"),
        }


# Kafka Producer (optional, graceful degradation)
try:
    from kafka import KafkaProducer
    import json as _json

    _producer = KafkaProducer(
        bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"),
        value_serializer=lambda value: _json.dumps(value).encode("utf-8"),
        api_version=(0, 10, 2),
        request_timeout_ms=5000,
    )
    KAFKA_ENABLED = True
except Exception:
    _producer = None
    KAFKA_ENABLED = False


def publish_event(topic: str, data: dict):
    if KAFKA_ENABLED and _producer:
        try:
            _producer.send(topic, value=data)
            _producer.flush(timeout=1)
        except Exception as exc:
            print(f"[Kafka] Failed to publish to {topic}: {exc}")


app = FastAPI(
    title="CIP ML Platform",
    description="Career Intelligence Platform - AI/ML Intelligence Layer",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "CIP ML Platform",
        "version": "1.0.0",
        "status": "operational",
        "kafka_enabled": KAFKA_ENABLED,
        "gemini_enabled": _get_gemini_model() is not None,
        "endpoints": [
            "POST /ml/resume/analyze",
            "POST /ml/interview/question",
            "POST /ml/interview/evaluate",
            "POST /ml/interview/coach",
            "POST /ml/readiness",
            "POST /ml/recommend",
            "POST /ml/certificate/validate",
        ],
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "modules": {
            "resume_analyzer": "active",
            "interview_evaluator": "active",
            "career_readiness": "active",
            "recommendation_engine": "active",
            "certificate_validator": "active",
        },
        "kafka": "connected" if KAFKA_ENABLED else "disconnected (offline mode)",
        "gemini": "configured" if _get_gemini_model() is not None else "not configured",
    }


@app.post("/ml/resume/analyze", response_model=ResumeAnalyzeResponse, tags=["Resume"])
async def analyze_resume_endpoint(request: ResumeAnalyzeRequest, background_tasks: BackgroundTasks):
    start = time.time()
    if not request.text:
        raise HTTPException(status_code=400, detail="Resume text is required")

    try:
        result = analyze_resume(
            text=request.text,
            student_id=request.student_id,
            job_role=request.job_role or "SDE",
        )
        background_tasks.add_task(
            publish_event,
            "score-events",
            {
                "event_type": "resume_analyzed",
                "student_id": request.student_id,
                "resume_score": result["resume_score"],
                "skills_count": len(result["skills"]),
                "timestamp": time.time(),
            },
        )
        result["processing_time_ms"] = round((time.time() - start) * 1000, 2)
        return JSONResponse(content=result)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}")


@app.post("/ml/resume/upload", tags=["Resume"])
async def upload_resume(student_id: str, job_role: str = "SDE", file: UploadFile = File(...)):
    if not file.filename.endswith((".pdf", ".txt")):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files supported")
    content = await file.read()
    try:
        text = content.decode("utf-8", errors="ignore")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read file content")
    result = analyze_resume(text=text, student_id=student_id, job_role=job_role)
    return JSONResponse(content=result)


@app.post("/ml/interview/question", response_model=InterviewQuestionResponse, tags=["Interview"])
async def next_interview_question(request: InterviewQuestionRequest):
    try:
        payload = _generate_question(
            resume_data=request.resume_data or {},
            job_role=request.job_role or "SDE",
            previous_answers=request.previous_answers or [],
            persona_mode=(request.resume_data or {}).get("persona_mode", "friendly"),
        )
        return JSONResponse(content=payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Question generation failed: {exc}")


@app.post("/ml/interview/evaluate", response_model=InterviewEvaluateResponse, tags=["Interview"])
async def evaluate_interview_endpoint(request: InterviewEvaluateRequest, background_tasks: BackgroundTasks):
    try:
        result = evaluate_interview({
            "student_id": request.student_id,
            "question": request.question,
            "answer_text": request.answer_text,
            "expected_answer": request.expected_answer,
            "domain": request.domain,
            "difficulty": request.difficulty,
            "audio_features": request.audio_features,
        })
        background_tasks.add_task(
            publish_event,
            "score-events",
            {
                "event_type": "interview_evaluated",
                "student_id": request.student_id,
                "overall_score": result["overall_score"],
                "technical_score": result["technical_score"],
                "timestamp": time.time(),
            },
        )
        return JSONResponse(content=result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {exc}")


@app.post("/ml/interview/coach", tags=["Interview"])
async def coach_interview_answer(payload: dict):
    answer = str(payload.get("answer", "")).strip()
    question = str(payload.get("question", "")).strip()
    job_role = str(payload.get("job_role", "SDE")).strip() or "SDE"
    persona_mode = str(payload.get("persona_mode", "friendly")).strip() or "friendly"
    resume_skills = [str(skill).strip() for skill in payload.get("resume_skills", []) if str(skill).strip()]
    expected_answer = str(payload.get("expected_answer", "")).strip() or f"A strong answer should connect the idea to {job_role}, mention tradeoffs, and give one example."
    topic = str(payload.get("topic", "DSA")).strip() or "DSA"

    if not answer or not question:
        raise HTTPException(status_code=400, detail="Both question and answer are required")

    ai_feedback = _evaluate_with_gemini(question, answer, resume_skills, persona_mode)
    feedback = ai_feedback or _heuristic_feedback(question, answer, expected_answer, topic)

    speech_text = f"Score {feedback['score']}. Good: {feedback['good']}. Missing: {feedback['missing']}. Tip: {feedback['tip']}"
    audio = None
    try:
        audio = await _tts_with_elevenlabs(speech_text, persona_mode)
    except Exception:
        audio = None

    response = {
        "score": feedback["score"],
        "good": feedback["good"],
        "missing": feedback["missing"],
        "ideal": feedback["ideal"],
        "tip": feedback["tip"],
        "speech_text": speech_text,
        "audio": audio,
        "provider": audio["provider"] if audio else "browser",
    }
    return JSONResponse(content=response)


@app.post("/ml/readiness", response_model=CareerReadinessResponse, tags=["Career"])
async def career_readiness_endpoint(request: CareerReadinessRequest, background_tasks: BackgroundTasks):
    try:
        result = compute_readiness({
            "student_id": request.student_id,
            "resume_score": request.resume_score,
            "academic_score": request.academic_score,
            "interview_score": request.interview_score,
            "target_role": request.target_role or "SDE",
        })
        background_tasks.add_task(
            publish_event,
            "score-events",
            {
                "event_type": "readiness_computed",
                "student_id": request.student_id,
                "readiness_score": result["readiness_score"],
                "level": result["level"],
                "timestamp": time.time(),
            },
        )
        return JSONResponse(content=result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Readiness computation failed: {exc}")


@app.post("/ml/recommend", response_model=RecommendResponse, tags=["Recommendation"])
async def recommend_endpoint(request: RecommendRequest, background_tasks: BackgroundTasks):
    try:
        result = recommend_jobs({
            "student_id": request.student_id,
            "student_skills": request.student_skills,
            "cgpa": request.cgpa,
            "readiness_score": request.readiness_score,
            "interests": request.interests or [],
            "preferred_domains": request.preferred_domains or [],
            "jobs": [job.dict() for job in request.jobs],
        })
        background_tasks.add_task(
            publish_event,
            "recommendation-events",
            {
                "event_type": "jobs_recommended",
                "student_id": request.student_id,
                "top_job_id": result["recommendations"][0]["job_id"] if result["recommendations"] else None,
                "count": len(result["recommendations"]),
                "timestamp": time.time(),
            },
        )
        return JSONResponse(content=result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {exc}")


@app.post("/ml/certificate/validate", tags=["Certificate"])
async def validate_certificate_endpoint(
    certificate_id: str,
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
):
    from services.certificate_validator.engine import validate_certificate
    import shutil
    import tempfile

    start = time.time()
    if not file.filename.lower().endswith((".pdf", ".jpg", ".jpeg", ".png")):
        raise HTTPException(status_code=400, detail="Only PDF, JPG, PNG files supported")

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp_file:
            shutil.copyfileobj(file.file, tmp_file)
            tmp_path = tmp_file.name

        result = validate_certificate(certificate_id=certificate_id, image_path=tmp_path)
        result["processing_time_ms"] = round((time.time() - start) * 1000, 2)

        if background_tasks:
            background_tasks.add_task(
                publish_event,
                "certificate-events",
                {
                    "event_type": "CERTIFICATE_VALIDATED",
                    "certificate_id": certificate_id,
                    "authenticity_score": result["authenticity_score"],
                    "status": result["status"],
                    "timestamp": time.time(),
                },
            )

        os.unlink(tmp_path)
        return JSONResponse(content=result)
    except Exception as exc:
        if "tmp_path" in locals() and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise HTTPException(status_code=500, detail=f"Validation failed: {exc}")


@app.post("/ml/batch/analyze", tags=["Batch"])
async def batch_analyze(requests: list):
    results = []
    for request in requests[:50]:
        request_type = request.get("type")
        data = request.get("data", {})
        try:
            if request_type == "resume":
                result = analyze_resume(**data)
            elif request_type == "interview":
                result = evaluate_interview(data)
            elif request_type == "readiness":
                result = compute_readiness(data)
            elif request_type == "recommend":
                result = recommend_jobs(data)
            else:
                result = {"error": f"Unknown type: {request_type}"}
            results.append({"type": request_type, "status": "success", "result": result})
        except Exception as exc:
            results.append({"type": request_type, "status": "error", "error": str(exc)})
    return {"batch_size": len(requests), "results": results}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
