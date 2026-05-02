"""
MODULE 3: Interview Evaluator
Evaluates student interview answers using NLP similarity + LLM analysis.
Scores: Technical accuracy, Communication quality, Confidence signals.
"""
import re
import math
import time
from typing import Dict, List, Tuple, Optional
from collections import Counter


# ─── Question Answer Knowledge Base ───────────────────────────────────────────

ANSWER_KNOWLEDGE_BASE = {
    "DSA": {
        "What is Big O notation?": {
            "key_concepts": ["time complexity", "space complexity", "worst case", "upper bound", "algorithm efficiency"],
            "ideal_answer": "Big O notation describes the upper bound of an algorithm's time or space complexity as input grows, representing the worst-case scenario.",
            "common_mistakes": ["confusing with Big Theta", "ignoring space complexity", "wrong examples"],
            "follow_ups": ["What is O(n log n)?", "Compare O(n) vs O(n²)"]
        },
        "Explain Binary Search": {
            "key_concepts": ["sorted array", "divide and conquer", "mid element", "O(log n)", "left right pointers"],
            "ideal_answer": "Binary search works on sorted arrays by repeatedly dividing the search space in half, comparing with the middle element.",
            "common_mistakes": ["not mentioning sorted prerequisite", "wrong complexity", "infinite loop edge cases"]
        },
        "What is a linked list?": {
            "key_concepts": ["nodes", "pointers", "dynamic size", "head", "null termination", "singly doubly circular"],
            "ideal_answer": "A linked list is a linear data structure where elements (nodes) contain data and a pointer to the next node.",
            "common_mistakes": ["confusing with arrays", "not explaining pointer", "missing types"]
        },
    },
    "OOP": {
        "Explain Polymorphism": {
            "key_concepts": ["compile time", "runtime", "method overloading", "method overriding", "inheritance", "interface"],
            "ideal_answer": "Polymorphism allows the same interface to be used for different data types. Compile-time via overloading, runtime via overriding.",
            "common_mistakes": ["only explaining one type", "no code example", "confusion with encapsulation"]
        },
        "What is Encapsulation?": {
            "key_concepts": ["data hiding", "private", "getter", "setter", "access modifiers", "security"],
            "ideal_answer": "Encapsulation bundles data and methods together while restricting direct access using access modifiers like private.",
            "common_mistakes": ["not mentioning access control", "confusing with abstraction"]
        },
    },
    "System Design": {
        "Design a URL shortener": {
            "key_concepts": ["hash function", "database", "cache", "load balancer", "redirects", "301 vs 302", "analytics"],
            "ideal_answer": "URL shortener needs: hash generation, database for mapping, Redis cache for hot URLs, load balancer for scale.",
            "common_mistakes": ["no caching", "no scale consideration", "no analytics mention"]
        },
    },
    "OS": {
        "What is a deadlock?": {
            "key_concepts": ["mutual exclusion", "hold and wait", "no preemption", "circular wait", "prevention", "detection"],
            "ideal_answer": "Deadlock occurs when processes wait for resources held by each other, satisfying all four Coffman conditions.",
            "common_mistakes": ["missing one condition", "no prevention strategy", "vague definition"]
        },
    }
}

# ─── Semantic Similarity Engine ────────────────────────────────────────────────

class TextSimilarity:
    """TF-IDF inspired similarity without heavy ML dependencies."""

    def tokenize(self, text: str) -> List[str]:
        text = text.lower()
        text = re.sub(r'[^\w\s]', ' ', text)
        tokens = text.split()
        # Remove stopwords
        stopwords = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
                     'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
                     'would', 'could', 'should', 'may', 'might', 'can', 'to', 'of',
                     'in', 'for', 'on', 'with', 'as', 'by', 'at', 'from', 'that',
                     'this', 'it', 'its', 'and', 'or', 'but', 'not', 'so', 'if'}
        return [t for t in tokens if t not in stopwords and len(t) > 2]

    def cosine_similarity(self, text1: str, text2: str) -> float:
        """Compute cosine similarity between two texts."""
        tokens1 = Counter(self.tokenize(text1))
        tokens2 = Counter(self.tokenize(text2))

        if not tokens1 or not tokens2:
            return 0.0

        # Intersection
        intersection = set(tokens1.keys()) & set(tokens2.keys())
        numerator = sum(tokens1[w] * tokens2[w] for w in intersection)

        magnitude1 = math.sqrt(sum(v**2 for v in tokens1.values()))
        magnitude2 = math.sqrt(sum(v**2 for v in tokens2.values()))

        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0

        return round(numerator / (magnitude1 * magnitude2), 3)

    def keyword_coverage(self, answer: str, key_concepts: List[str]) -> Tuple[float, List[str], List[str]]:
        """Check what key concepts are covered in the answer."""
        answer_lower = answer.lower()
        covered = []
        missing = []

        for concept in key_concepts:
            # Check for concept or its variations
            concept_words = concept.lower().split()
            if any(word in answer_lower for word in concept_words):
                covered.append(concept)
            else:
                missing.append(concept)

        coverage = len(covered) / len(key_concepts) if key_concepts else 0
        return round(coverage, 3), covered, missing


# ─── Communication Analyzer ────────────────────────────────────────────────────

class CommunicationAnalyzer:
    """Analyzes text-based communication quality."""

    def analyze(self, answer: str) -> Dict:
        """Score communication quality from text."""
        scores = {}

        # 1. Clarity (sentence structure)
        sentences = re.split(r'[.!?]+', answer.strip())
        sentences = [s.strip() for s in sentences if len(s.strip()) > 5]
        avg_sentence_len = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)
        # Ideal: 10-25 words per sentence
        if 10 <= avg_sentence_len <= 25:
            scores["clarity"] = 1.0
        elif 8 <= avg_sentence_len <= 30:
            scores["clarity"] = 0.8
        elif avg_sentence_len < 5:
            scores["clarity"] = 0.4  # Too terse
        else:
            scores["clarity"] = 0.6  # Too long

        # 2. Coherence (logical connectors)
        connectors = ['because', 'therefore', 'however', 'furthermore', 'additionally',
                      'first', 'second', 'finally', 'for example', 'such as', 'which means',
                      'this means', 'in other words', 'as a result', 'consequently']
        connector_count = sum(1 for c in connectors if c in answer.lower())
        scores["coherence"] = min(1.0, 0.4 + connector_count * 0.12)

        # 3. Depth (length and elaboration)
        word_count = len(answer.split())
        if word_count < 20:
            scores["depth"] = 0.2
        elif word_count < 50:
            scores["depth"] = 0.5
        elif word_count < 100:
            scores["depth"] = 0.75
        elif word_count < 200:
            scores["depth"] = 0.9
        else:
            scores["depth"] = 1.0

        # 4. Technical vocabulary density
        filler_words = ['um', 'uh', 'like', 'basically', 'literally', 'kind of', 'sort of', 'you know']
        filler_count = sum(answer.lower().count(f) for f in filler_words)
        vocab_penalty = min(0.3, filler_count * 0.05)
        scores["vocabulary"] = max(0.4, 1.0 - vocab_penalty)

        # 5. Structure (has examples / analogies)
        has_example = any(w in answer.lower() for w in ['example', 'instance', 'e.g.', 'like', 'suppose', 'consider'])
        scores["structure"] = 0.8 if has_example else 0.5

        comm_score = (
            scores["clarity"] * 0.25 +
            scores["coherence"] * 0.25 +
            scores["depth"] * 0.2 +
            scores["vocabulary"] * 0.15 +
            scores["structure"] * 0.15
        )

        return {
            "score": round(comm_score * 100, 1),
            "breakdown": {k: round(v * 100, 1) for k, v in scores.items()}
        }


# ─── Confidence Analyzer (Text-based) ─────────────────────────────────────────

class ConfidenceAnalyzer:
    """Analyze confidence from text (proxy for voice analysis)."""

    CONFIDENT_SIGNALS = [
        'is', 'are', 'means', 'refers to', 'works by', 'consists of',
        'specifically', 'precisely', 'exactly', 'always', 'definitively'
    ]
    UNCERTAIN_SIGNALS = [
        'i think', 'i believe', 'maybe', 'perhaps', 'probably', 'not sure',
        'i guess', 'might be', 'could be', 'i don\'t know', 'im not sure',
        'basically', 'kind of', 'sort of'
    ]

    def analyze(self, answer: str, audio_features: Optional[Dict] = None) -> Dict:
        answer_lower = answer.lower()

        # Text-based confidence
        confident_count = sum(1 for s in self.CONFIDENT_SIGNALS if s in answer_lower)
        uncertain_count = sum(1 for s in self.UNCERTAIN_SIGNALS if s in answer_lower)

        base_score = 0.6
        text_confidence = base_score + (confident_count * 0.05) - (uncertain_count * 0.08)
        text_confidence = max(0.2, min(1.0, text_confidence))

        # Voice features (if available from Whisper)
        voice_confidence = None
        if audio_features:
            speech_rate = audio_features.get("words_per_minute", 130)
            pause_ratio = audio_features.get("pause_ratio", 0.15)
            pitch_variance = audio_features.get("pitch_variance", 0.5)
            volume_consistency = audio_features.get("volume_consistency", 0.7)

            # Ideal speech rate: 120-160 wpm
            rate_score = 1.0 if 120 <= speech_rate <= 160 else \
                         0.7 if 100 <= speech_rate <= 180 else 0.5
            pause_score = 1.0 - min(1.0, pause_ratio * 3)
            pitch_score = 1.0 - abs(pitch_variance - 0.5) * 0.5

            voice_confidence = (rate_score * 0.4 + pause_score * 0.3 +
                                pitch_score * 0.15 + volume_consistency * 0.15)

        final_confidence = (
            (text_confidence * 0.4 + voice_confidence * 0.6)
            if voice_confidence else text_confidence
        )

        return {
            "score": round(final_confidence * 100, 1),
            "text_confidence": round(text_confidence * 100, 1),
            "voice_confidence": round(voice_confidence * 100, 1) if voice_confidence else None,
            "uncertain_phrases": [s for s in self.UNCERTAIN_SIGNALS if s in answer_lower]
        }


# ─── Interview Evaluator Main ──────────────────────────────────────────────────

class InterviewEvaluator:

    def __init__(self):
        self.similarity = TextSimilarity()
        self.comm_analyzer = CommunicationAnalyzer()
        self.conf_analyzer = ConfidenceAnalyzer()
        self.knowledge_base = ANSWER_KNOWLEDGE_BASE

    def find_reference(self, question: str, domain: str) -> Optional[Dict]:
        """Find best matching reference Q&A."""
        domain_kb = self.knowledge_base.get(domain, {})

        best_match = None
        best_score = 0

        for ref_q, ref_data in domain_kb.items():
            sim = self.similarity.cosine_similarity(question, ref_q)
            if sim > best_score:
                best_score = sim
                best_match = ref_data

        # Also check across all domains
        if best_score < 0.3:
            for d, questions in self.knowledge_base.items():
                for ref_q, ref_data in questions.items():
                    sim = self.similarity.cosine_similarity(question, ref_q)
                    if sim > best_score:
                        best_score = sim
                        best_match = ref_data

        return best_match if best_score > 0.2 else None

    def compute_technical_score(
        self,
        answer: str,
        question: str,
        expected_answer: Optional[str],
        domain: str,
        difficulty: str
    ) -> Tuple[float, List[str], List[str], str]:
        """Score technical accuracy of the answer."""

        reference = self.find_reference(question, domain)

        if reference:
            # Keyword coverage
            coverage, covered, missing = self.similarity.keyword_coverage(
                answer, reference["key_concepts"]
            )

            # Semantic similarity with ideal answer
            semantic_sim = self.similarity.cosine_similarity(
                answer, reference["ideal_answer"]
            )

            # With expected answer if provided
            if expected_answer:
                exp_sim = self.similarity.cosine_similarity(answer, expected_answer)
                semantic_sim = (semantic_sim + exp_sim) / 2

            # Combined technical score
            tech_score = coverage * 0.6 + semantic_sim * 0.4

            model_hint = reference["ideal_answer"]
            key_concepts_covered = covered
            key_concepts_missing = missing

        else:
            # Fallback: general answer quality signals
            tech_keywords = self._get_domain_keywords(domain)
            coverage_count = sum(1 for kw in tech_keywords if kw in answer.lower())
            tech_score = min(1.0, coverage_count * 0.12 + 0.3)

            key_concepts_covered = [kw for kw in tech_keywords if kw in answer.lower()]
            key_concepts_missing = [kw for kw in tech_keywords if kw not in answer.lower()][:5]
            model_hint = f"A strong {domain} answer should include: {', '.join(tech_keywords[:5])}"

        # Difficulty multiplier
        diff_multiplier = {"Easy": 0.9, "Medium": 1.0, "Hard": 1.1}.get(difficulty, 1.0)
        tech_score = min(1.0, tech_score * diff_multiplier)

        return (
            round(tech_score * 100, 1),
            key_concepts_covered,
            key_concepts_missing,
            model_hint
        )

    def _get_domain_keywords(self, domain: str) -> List[str]:
        """Get important technical keywords for a domain."""
        domain_keywords = {
            "DSA": ["complexity", "algorithm", "data structure", "array", "tree", "graph", "dynamic"],
            "OOP": ["class", "object", "inheritance", "polymorphism", "encapsulation", "abstraction"],
            "System Design": ["scalability", "database", "cache", "load balancer", "api", "microservice"],
            "OS": ["process", "thread", "deadlock", "memory", "scheduling", "kernel"],
            "Networks": ["tcp", "http", "dns", "protocol", "packet", "routing"],
            "Database": ["sql", "index", "normalization", "transaction", "acid", "join"],
        }
        return domain_keywords.get(domain, ["algorithm", "data", "system", "design", "implementation"])

    def generate_feedback(
        self,
        tech_score: float,
        comm_score: float,
        conf_score: float,
        missing_concepts: List[str],
        covered_concepts: List[str]
    ) -> Tuple[str, List[str], List[str]]:
        """Generate natural language feedback."""
        overall = (tech_score * 0.5 + comm_score * 0.3 + conf_score * 0.2)

        strengths, improvements = [], []

        if tech_score >= 75:
            strengths.append("Strong technical knowledge demonstrated")
        elif tech_score >= 50:
            strengths.append("Shows foundational technical understanding")
        else:
            improvements.append("Deepen technical knowledge before the interview")

        if covered_concepts:
            strengths.append(f"Correctly covered: {', '.join(covered_concepts[:3])}")

        if missing_concepts:
            improvements.append(f"Study missing concepts: {', '.join(missing_concepts[:3])}")

        if comm_score >= 75:
            strengths.append("Clear and well-structured communication")
        else:
            improvements.append("Use concrete examples and structure your answer with 'first...then...finally'")

        if conf_score >= 75:
            strengths.append("Confident delivery")
        else:
            improvements.append("Avoid uncertain phrases like 'I think' or 'maybe' — speak with conviction")

        # Generate main feedback sentence
        if overall >= 80:
            feedback = "Excellent answer! Strong technical depth with clear communication."
        elif overall >= 65:
            feedback = f"Good attempt. Focus on adding: {', '.join(missing_concepts[:2]) if missing_concepts else 'more examples'}."
        elif overall >= 50:
            feedback = f"Partially correct. Explain concepts more clearly and cover: {', '.join(missing_concepts[:2]) if missing_concepts else 'key concepts'}."
        else:
            feedback = "Answer needs significant improvement. Review core concepts and practice structured responses."

        return feedback, strengths, improvements

    def evaluate(self, data: Dict) -> Dict:
        """Full interview evaluation pipeline."""

        answer = data["answer_text"]
        question = data["question"]
        student_id = data["student_id"]
        domain = data.get("domain", "DSA")
        difficulty = data.get("difficulty", "Medium")
        expected_answer = data.get("expected_answer")
        audio_features = data.get("audio_features")

        # 1. Technical Score
        tech_score, covered, missing, model_hint = self.compute_technical_score(
            answer, question, expected_answer, domain, difficulty
        )

        # 2. Communication Score
        comm_result = self.comm_analyzer.analyze(answer)
        comm_score = comm_result["score"]

        # 3. Confidence Score
        conf_result = self.conf_analyzer.analyze(answer, audio_features)
        conf_score = conf_result["score"]

        # 4. Overall weighted score
        overall = round(tech_score * 0.5 + comm_score * 0.3 + conf_score * 0.2, 1)

        # 5. Feedback
        feedback, strengths, improvements = self.generate_feedback(
            tech_score, comm_score, conf_score, missing, covered
        )

        return {
            "student_id": student_id,
            "technical_score": tech_score,
            "confidence_score": conf_score,
            "communication_score": comm_score,
            "overall_score": overall,
            "feedback": feedback,
            "strengths": strengths,
            "improvements": improvements,
            "key_concepts_covered": covered,
            "key_concepts_missing": missing,
            "model_answer_hint": model_hint
        }


_evaluator = InterviewEvaluator()

def evaluate_interview(data: Dict) -> Dict:
    return _evaluator.evaluate(data)
