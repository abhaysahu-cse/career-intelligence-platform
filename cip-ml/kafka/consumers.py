"""
CIP ML Platform - Kafka Integration Layer
Consumers for: resume-events, interview-events, student-events
Producers for: score-events, recommendation-events
"""
import json
import time
import threading
import logging
from typing import Callable, Dict, Optional

logger = logging.getLogger(__name__)


class CIPKafkaConsumer:
    """
    Kafka consumer for CIP ML Platform.
    Listens to events from backend and triggers ML pipelines.
    """

    TOPICS = {
        "resume-events": "handle_resume_event",
        "interview-events": "handle_interview_event",
        "student-events": "handle_student_event",
    }

    def __init__(self, bootstrap_servers: str = "localhost:9092"):
        self.bootstrap_servers = bootstrap_servers
        self.running = False
        self._consumers = {}
        self._producer = None
        self._kafka_available = False

        try:
            from kafka import KafkaConsumer, KafkaProducer
            self._KafkaConsumer = KafkaConsumer
            self._KafkaProducer = KafkaProducer
            self._init_producer()
            self._kafka_available = True
            logger.info("✅ Kafka connection initialized")
        except ImportError:
            logger.warning("⚠️ kafka-python not installed. Running in offline mode.")
        except Exception as e:
            logger.warning(f"⚠️ Kafka unavailable: {e}. Running in offline mode.")

    def _init_producer(self):
        self._producer = self._KafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            api_version=(0, 10, 2)
        )

    def publish(self, topic: str, data: Dict):
        """Publish result event to Kafka."""
        if self._producer:
            try:
                self._producer.send(topic, value=data)
                logger.info(f"📤 Published to [{topic}]: student={data.get('student_id')}")
            except Exception as e:
                logger.error(f"Failed to publish to {topic}: {e}")
        else:
            logger.info(f"[OFFLINE] Would publish to [{topic}]: {json.dumps(data, indent=2)}")

    def handle_resume_event(self, event: Dict):
        """
        Triggered when: Resume is uploaded by student
        Runs: Resume Analyzer pipeline
        Produces: score-events (resume_score)
        """
        from services.resume_analyzer.engine import analyze_resume

        student_id = event.get("student_id")
        resume_text = event.get("resume_text", "")
        job_role = event.get("job_role", "SDE")

        logger.info(f"📥 Processing resume for student: {student_id}")

        try:
            result = analyze_resume(resume_text, student_id, job_role)

            self.publish("score-events", {
                "event_type": "resume_scored",
                "student_id": student_id,
                "resume_score": result["resume_score"],
                "skills": result["skills"],
                "missing_skills": result["missing_skills"],
                "experience_level": result["experience_level"],
                "timestamp": time.time(),
                "source": "ml-resume-analyzer"
            })

            logger.info(f"✅ Resume scored: {result['resume_score']}/100 for {student_id}")

        except Exception as e:
            logger.error(f"❌ Resume analysis failed for {student_id}: {e}")
            self.publish("score-events", {
                "event_type": "resume_failed",
                "student_id": student_id,
                "error": str(e),
                "timestamp": time.time()
            })

    def handle_interview_event(self, event: Dict):
        """
        Triggered when: Student submits interview answer
        Runs: Interview Evaluator
        Produces: score-events (interview_score)
        """
        from services.interview_evaluator.engine import evaluate_interview
        from services.career_readiness.engine import compute_readiness

        student_id = event.get("student_id")
        logger.info(f"📥 Evaluating interview for student: {student_id}")

        try:
            result = evaluate_interview(event)

            self.publish("score-events", {
                "event_type": "interview_scored",
                "student_id": student_id,
                "overall_score": result["overall_score"],
                "technical_score": result["technical_score"],
                "confidence_score": result["confidence_score"],
                "communication_score": result["communication_score"],
                "feedback": result["feedback"],
                "timestamp": time.time(),
                "source": "ml-interview-evaluator"
            })

            logger.info(f"✅ Interview scored: {result['overall_score']}/100 for {student_id}")

        except Exception as e:
            logger.error(f"❌ Interview evaluation failed for {student_id}: {e}")

    def handle_student_event(self, event: Dict):
        """
        Triggered when: Academic data updated or student profile changed
        Runs: Academic Predictor → Career Readiness → Recommendation Engine
        Produces: score-events, recommendation-events
        """
        from services.academic_predictor.engine import predict_academic
        from services.career_readiness.engine import compute_readiness, recommend_jobs

        student_id = event.get("student_id")
        event_subtype = event.get("subtype", "academic_update")

        logger.info(f"📥 Processing student event [{event_subtype}] for: {student_id}")

        try:
            if event_subtype == "academic_update":
                academic_data = event.get("academic_data", {})
                academic_result = predict_academic({
                    "student_id": student_id,
                    **academic_data
                })

                self.publish("score-events", {
                    "event_type": "academic_predicted",
                    "student_id": student_id,
                    "predicted_cgpa": academic_result["predicted_cgpa"],
                    "risk_level": academic_result["risk_level"],
                    "timestamp": time.time(),
                    "source": "ml-academic-predictor"
                })

            elif event_subtype == "readiness_update":
                # Compute unified readiness from all scores
                readiness_result = compute_readiness({
                    "student_id": student_id,
                    "resume_score": event.get("resume_score"),
                    "academic_score": event.get("academic_score"),
                    "interview_score": event.get("interview_score"),
                    "target_role": event.get("target_role", "SDE")
                })

                self.publish("score-events", {
                    "event_type": "readiness_computed",
                    "student_id": student_id,
                    "readiness_score": readiness_result["readiness_score"],
                    "level": readiness_result["level"],
                    "next_actions": readiness_result["next_actions"],
                    "timestamp": time.time(),
                    "source": "ml-readiness-model"
                })

                # Trigger recommendations
                if event.get("jobs"):
                    rec_result = recommend_jobs({
                        "student_id": student_id,
                        "student_skills": event.get("skills", []),
                        "cgpa": event.get("cgpa", 7.0),
                        "readiness_score": readiness_result["readiness_score"],
                        "interests": event.get("interests", []),
                        "preferred_domains": event.get("preferred_domains", []),
                        "jobs": event.get("jobs", [])
                    })

                    self.publish("recommendation-events", {
                        "event_type": "jobs_recommended",
                        "student_id": student_id,
                        "recommendations": rec_result["recommendations"][:5],
                        "total_analyzed": rec_result["total_jobs_analyzed"],
                        "timestamp": time.time(),
                        "source": "ml-recommendation-engine"
                    })

        except Exception as e:
            logger.error(f"❌ Student event processing failed for {student_id}: {e}")

    def start_consuming(self, topics: Optional[list] = None):
        """Start consuming messages from Kafka topics."""
        if not self._kafka_available:
            logger.info("Running in offline mode - no Kafka consumers started")
            return

        topics = topics or list(self.TOPICS.keys())

        def consume_topic(topic: str):
            consumer = self._KafkaConsumer(
                topic,
                bootstrap_servers=self.bootstrap_servers,
                group_id="cip-ml-consumers",
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                auto_offset_reset='earliest',
                enable_auto_commit=True,
                max_poll_interval_ms=300000
            )

            logger.info(f"👂 Listening on topic: [{topic}]")
            handler_name = self.TOPICS.get(topic)
            handler: Callable = getattr(self, handler_name, None)

            for message in consumer:
                if not self.running:
                    break
                try:
                    event = message.value
                    logger.info(f"📨 Received from [{topic}]: {event.get('student_id', 'unknown')}")
                    if handler:
                        handler(event)
                except Exception as e:
                    logger.error(f"Error processing message from {topic}: {e}")

        self.running = True
        threads = []
        for topic in topics:
            t = threading.Thread(target=consume_topic, args=(topic,), daemon=True)
            t.start()
            threads.append(t)

        logger.info(f"🚀 CIP ML Kafka consumers started on {len(threads)} topics")
        return threads

    def stop(self):
        self.running = False
        logger.info("⏹️ Kafka consumers stopped")


# ─── Event Flow Documentation ─────────────────────────────────────────────────

EVENT_FLOW = """
╔══════════════════════════════════════════════════════════════════════╗
║                    CIP ML - KAFKA EVENT FLOW                         ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  INCOMING (consume)          ML Processing          OUTGOING (produce)║
║  ─────────────────           ────────────           ──────────────── ║
║                                                                      ║
║  resume-events      ──►  Resume Analyzer    ──►  score-events        ║
║    student_id               (NLP)                  resume_score      ║
║    resume_text                                      skills           ║
║    job_role                                         missing_skills   ║
║                                                                      ║
║  interview-events   ──►  Interview Eval     ──►  score-events        ║
║    student_id               (NLP)                  interview_score   ║
║    question                                         feedback         ║
║    answer_text                                      breakdown        ║
║                                                                      ║
║  student-events     ──►  Academic Pred      ──►  score-events        ║
║    student_id           +  Readiness            predicted_cgpa       ║
║    marks, cgpa          +  Recommender          risk_level           ║
║    attendance                               ──►  recommendation-events║
║                                                  top_job_matches     ║
╚══════════════════════════════════════════════════════════════════════╝
"""


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print(EVENT_FLOW)

    consumer = CIPKafkaConsumer()
    threads = consumer.start_consuming()

    if threads:
        try:
            for t in threads:
                t.join()
        except KeyboardInterrupt:
            consumer.stop()
