"""
MODULE 4: Career Readiness Model
MODULE 5: Recommendation Engine
Unified scoring + job matching system
"""
import math
from typing import Dict, List, Optional, Tuple


# ─── MODULE 4: Career Readiness ────────────────────────────────────────────────

class CareerReadinessModel:
    """
    Single unified career readiness score.
    Formula: Readiness = w1*Resume + w2*Academic + w3*Interview
    Weights adapt based on which components are available and target role.
    """

    # Default weights per role
    ROLE_WEIGHTS = {
        "SDE": {
            "resume": 0.35,
            "academic": 0.25,
            "interview": 0.40
        },
        "Data Science": {
            "resume": 0.30,
            "academic": 0.35,
            "interview": 0.35
        },
        "DevOps": {
            "resume": 0.45,
            "academic": 0.15,
            "interview": 0.40
        },
        "Frontend": {
            "resume": 0.40,
            "academic": 0.20,
            "interview": 0.40
        },
        "Backend": {
            "resume": 0.35,
            "academic": 0.25,
            "interview": 0.40
        },
        "Default": {
            "resume": 0.35,
            "academic": 0.30,
            "interview": 0.35
        }
    }

    READINESS_LEVELS = [
        (80, "Highly Ready"),
        (65, "Ready"),
        (50, "Almost Ready"),
        (35, "Needs Work"),
        (0, "Not Ready")
    ]

    # Simulated percentile distribution for comparison
    PERCENTILE_DIST = [20, 30, 40, 50, 55, 60, 65, 68, 72, 75, 78, 80, 82, 85, 90]

    def get_weights(self, target_role: str, available_components: List[str]) -> Dict[str, float]:
        """Get adaptive weights based on role and available data."""
        base = self.ROLE_WEIGHTS.get(target_role, self.ROLE_WEIGHTS["Default"]).copy()

        # Redistribute weight for missing components
        missing = [c for c in ["resume", "academic", "interview"] if c not in available_components]
        available = [c for c in ["resume", "academic", "interview"] if c in available_components]

        if not available:
            return base

        extra = sum(base[m] for m in missing) / len(available) if missing else 0

        weights = {}
        for comp in ["resume", "academic", "interview"]:
            if comp in available:
                weights[comp] = round(base[comp] + extra, 3)
            else:
                weights[comp] = 0.0

        return weights

    def compute_readiness(
        self,
        resume_score: Optional[float],
        academic_score: Optional[float],
        interview_score: Optional[float],
        target_role: str
    ) -> Tuple[float, Dict[str, float], Dict[str, float]]:
        """Compute weighted readiness score."""
        components = {}
        if resume_score is not None:
            components["resume"] = resume_score
        if academic_score is not None:
            components["academic"] = academic_score
        if interview_score is not None:
            components["interview"] = interview_score

        if not components:
            return 0.0, {}, {}

        weights = self.get_weights(target_role, list(components.keys()))

        readiness = sum(
            components[comp] * weights[comp]
            for comp in components
        )

        return round(readiness, 1), components, weights

    def get_level(self, score: float) -> str:
        for threshold, level in self.READINESS_LEVELS:
            if score >= threshold:
                return level
        return "Not Ready"

    def estimate_percentile(self, score: float) -> float:
        """Estimate student's percentile among all students."""
        count_below = sum(1 for s in self.PERCENTILE_DIST if s <= score)
        return round((count_below / len(self.PERCENTILE_DIST)) * 100, 1)

    def estimate_days_to_ready(self, score: float, level: str) -> int:
        """Estimate days needed to reach 'Ready' level."""
        if level in ["Ready", "Highly Ready"]:
            return 0

        gap = 65 - score  # Target: 65 (Ready)
        if gap <= 0:
            return 0

        # Assumes ~0.3 points improvement per day with consistent effort
        return max(7, int(gap / 0.3))

    def generate_next_actions(
        self,
        level: str,
        components: Dict[str, float],
        weights: Dict[str, float],
        target_role: str
    ) -> Tuple[List[str], List[str]]:
        """Generate prioritized next actions and identify top gaps."""
        actions = []
        gaps = []

        # Identify lowest scoring component (highest weight for improvement)
        weighted_gaps = {
            comp: (100 - score) * weights.get(comp, 0.33)
            for comp, score in components.items()
        }
        priority_order = sorted(weighted_gaps, key=weighted_gaps.get, reverse=True)

        for comp in priority_order:
            score = components[comp]
            if comp == "resume" and score < 70:
                gaps.append(f"Resume Score: {score:.0f}/100")
                actions.append("Add 2-3 strong projects with GitHub links and live demos")
                actions.append("Include quantifiable achievements in each experience entry")
            elif comp == "academic" and score < 65:
                gaps.append(f"Academic Score: {score:.0f}/100")
                actions.append("Focus on improving CGPA — target weak subjects first")
                actions.append("Maintain attendance above 85%")
            elif comp == "interview" and score < 65:
                gaps.append(f"Interview Score: {score:.0f}/100")
                actions.append("Practice 2 LeetCode problems daily (focus on DSA fundamentals)")
                actions.append("Do AI interview practice weekly — record and review your answers")

        # Role-specific actions
        role_actions = {
            "SDE": ["Solve 100+ LeetCode problems", "Study System Design basics"],
            "Data Science": ["Complete a Kaggle competition", "Build an end-to-end ML project"],
            "DevOps": ["Get AWS Cloud Practitioner certified", "Deploy a project on Kubernetes"],
            "Frontend": ["Build a React portfolio project", "Learn TypeScript and Next.js"],
        }
        actions.extend(role_actions.get(target_role, [])[:2])

        # Level-specific actions
        if level == "Not Ready":
            actions.insert(0, "Start with core fundamentals: DSA, OOP, and one major framework")
        elif level == "Needs Work":
            actions.insert(0, "Focus on interview preparation — technical rounds are the bottleneck")
        elif level == "Almost Ready":
            actions.insert(0, "Apply to internships to gain real-world exposure")
        elif level == "Ready":
            actions.insert(0, "Apply to full-time roles and practice HR rounds")

        return list(set(actions))[:6], gaps[:3]

    def compute(self, data: Dict) -> Dict:
        student_id = data["student_id"]
        resume_score = data.get("resume_score")
        academic_score = data.get("academic_score")
        interview_score = data.get("interview_score")
        target_role = data.get("target_role", "SDE")

        readiness, components, weights = self.compute_readiness(
            resume_score, academic_score, interview_score, target_role
        )
        level = self.get_level(readiness)
        percentile = self.estimate_percentile(readiness)
        days = self.estimate_days_to_ready(readiness, level)
        actions, gaps = self.generate_next_actions(level, components, weights, target_role)

        return {
            "student_id": student_id,
            "readiness_score": readiness,
            "level": level,
            "component_scores": components,
            "weights_used": weights,
            "next_actions": actions,
            "estimated_ready_in_days": days,
            "top_gaps": gaps,
            "percentile": percentile
        }


# ─── MODULE 5: Recommendation Engine ──────────────────────────────────────────

class RecommendationEngine:
    """
    Skill-based job matching with personalization.
    Uses multi-factor scoring: skill overlap, CGPA, readiness, interests.
    """

    def skill_similarity(self, student_skills: List[str], job_skills: List[str]) -> Tuple[float, List[str], List[str]]:
        """Compute skill overlap between student and job."""
        student_set = {s.lower() for s in student_skills}
        job_set = {s.lower() for s in job_skills}

        matched = [s for s in job_skills if s.lower() in student_set]
        missing = [s for s in job_skills if s.lower() not in student_set]

        if not job_set:
            return 0.0, matched, missing

        # Jaccard-like similarity with weighting
        jaccard = len(matched) / len(job_set)

        # Bonus for critical skill matches
        critical_skills = {"dsa", "system design", "docker", "aws", "kubernetes",
                           "machine learning", "sql", "python", "java"}
        critical_matches = sum(1 for s in matched if s.lower() in critical_skills)
        bonus = min(0.2, critical_matches * 0.05)

        return round(min(1.0, jaccard + bonus), 3), matched, missing

    def compute_match_score(
        self,
        student_skills: List[str],
        cgpa: float,
        readiness_score: float,
        interests: List[str],
        preferred_domains: List[str],
        job: Dict
    ) -> Tuple[float, str]:
        """Compute match score (0-5) for a job."""

        # 1. Skill similarity (40%)
        skill_sim, matched, missing = self.skill_similarity(
            student_skills, job["required_skills"]
        )
        skill_component = skill_sim * 0.40

        # 2. CGPA eligibility (20%)
        min_cgpa = job.get("min_cgpa", 6.0)
        if cgpa >= min_cgpa + 1.0:
            cgpa_component = 0.20
        elif cgpa >= min_cgpa:
            cgpa_component = 0.16
        elif cgpa >= min_cgpa - 0.5:
            cgpa_component = 0.10
        else:
            cgpa_component = 0.0

        # 3. Readiness score fit (25%)
        readiness_component = (readiness_score / 100) * 0.25

        # 4. Domain/Interest match (15%)
        domain_match = 0.0
        job_domain = job.get("domain", "").lower()
        if preferred_domains and any(d.lower() in job_domain for d in preferred_domains):
            domain_match += 0.10
        if interests and any(i.lower() in job_domain for i in interests):
            domain_match += 0.05
        domain_component = domain_match

        total = skill_component + cgpa_component + readiness_component + domain_component
        score_5 = round(total * 5, 2)

        # Generate reason
        reason_parts = []
        if skill_sim >= 0.7:
            reason_parts.append(f"Excellent skill match ({len(matched)}/{len(job['required_skills'])} skills)")
        elif skill_sim >= 0.4:
            reason_parts.append(f"Good skill overlap ({len(matched)}/{len(job['required_skills'])} skills)")
        else:
            reason_parts.append(f"Partial skill match ({len(matched)} of {len(job['required_skills'])} required)")

        if cgpa >= min_cgpa:
            reason_parts.append("meets CGPA requirement")
        if domain_match > 0:
            reason_parts.append("matches your interests")

        reason = " — ".join(reason_parts)
        return score_5, reason, matched, missing

    def rank_jobs(
        self,
        student_id: str,
        student_skills: List[str],
        cgpa: float,
        readiness_score: float,
        interests: List[str],
        preferred_domains: List[str],
        jobs: List[Dict]
    ) -> Dict:
        """Rank and recommend jobs for a student."""

        recommendations = []

        for job in jobs:
            score, reason, matched, missing = self.compute_match_score(
                student_skills, cgpa, readiness_score,
                interests, preferred_domains, job
            )

            match_pct = round(score / 5 * 100, 1)

            recommendations.append({
                "job_id": job["job_id"],
                "title": job.get("title", "Unknown"),
                "company": job.get("company", "Unknown"),
                "match_score": score,
                "match_percent": match_pct,
                "reason": reason,
                "skill_match": matched,
                "skill_gap": missing[:5]
            })

        # Sort by match score descending
        recommendations.sort(key=lambda x: x["match_score"], reverse=True)

        # Personalization factors used
        factors = ["Skill compatibility analysis"]
        if cgpa > 7:
            factors.append("High CGPA eligibility match")
        if preferred_domains:
            factors.append(f"Domain preference: {', '.join(preferred_domains)}")
        if interests:
            factors.append(f"Interest alignment: {', '.join(interests[:2])}")

        return {
            "student_id": student_id,
            "recommendations": recommendations[:10],  # Top 10
            "total_jobs_analyzed": len(jobs),
            "personalization_factors": factors
        }

    def recommend(self, data: Dict) -> Dict:
        return self.rank_jobs(
            student_id=data["student_id"],
            student_skills=data["student_skills"],
            cgpa=data["cgpa"],
            readiness_score=data["readiness_score"],
            interests=data.get("interests", []),
            preferred_domains=data.get("preferred_domains", []),
            jobs=[j if isinstance(j, dict) else j.dict() for j in data["jobs"]]
        )


_readiness_model = CareerReadinessModel()
_recommendation_engine = RecommendationEngine()

def compute_readiness(data: Dict) -> Dict:
    return _readiness_model.compute(data)

def recommend_jobs(data: Dict) -> Dict:
    return _recommendation_engine.recommend(data)
