"""
MODULE 1: Resume Analyzer - NLP Engine
Converts resume text → structured intelligence
"""
import re
import time
import math
from typing import List, Dict, Tuple, Optional
from collections import defaultdict

# ─── Skill Knowledge Base ──────────────────────────────────────────────────────

SKILL_TAXONOMY = {
    "Languages": {
        "Python": ["python", "py"],
        "Java": ["java", "j2ee"],
        "JavaScript": ["javascript", "js", "node.js", "nodejs"],
        "TypeScript": ["typescript", "ts"],
        "C++": ["c++", "cpp", "c plus plus"],
        "C": [" c ", "c language"],
        "Go": ["golang", "go lang"],
        "Rust": ["rust"],
        "Kotlin": ["kotlin"],
        "Swift": ["swift"],
        "SQL": ["sql", "mysql", "postgresql", "sqlite"],
        "R": [" r ", "r language", "rlang"],
    },
    "Frameworks": {
        "Spring Boot": ["spring boot", "springboot", "spring framework"],
        "Django": ["django"],
        "Flask": ["flask"],
        "FastAPI": ["fastapi", "fast api"],
        "React": ["react", "reactjs", "react.js"],
        "Angular": ["angular", "angularjs"],
        "Vue.js": ["vue", "vuejs", "vue.js"],
        "Express.js": ["express", "expressjs"],
        "TensorFlow": ["tensorflow", "tf"],
        "PyTorch": ["pytorch", "torch"],
        "Scikit-learn": ["scikit", "sklearn", "scikit-learn"],
        "Hibernate": ["hibernate"],
        "Next.js": ["next.js", "nextjs"],
    },
    "Tools": {
        "Git": ["git", "github", "gitlab", "bitbucket"],
        "Docker": ["docker", "containerization"],
        "Kubernetes": ["kubernetes", "k8s"],
        "AWS": ["aws", "amazon web services", "ec2", "s3", "lambda"],
        "Azure": ["azure", "microsoft azure"],
        "GCP": ["gcp", "google cloud"],
        "Jenkins": ["jenkins", "ci/cd", "cicd"],
        "Linux": ["linux", "unix", "bash", "shell"],
        "MongoDB": ["mongodb", "mongo"],
        "Redis": ["redis"],
        "Kafka": ["kafka", "apache kafka"],
        "Elasticsearch": ["elasticsearch", "elastic"],
        "Postman": ["postman"],
        "Jira": ["jira"],
    },
    "Concepts": {
        "DSA": ["data structures", "algorithms", "dsa", "leetcode", "competitive programming"],
        "System Design": ["system design", "hld", "lld", "distributed systems", "microservices"],
        "Machine Learning": ["machine learning", "ml", "deep learning", "neural network", "nlp"],
        "OOP": ["object oriented", "oop", "oops", "design patterns"],
        "REST APIs": ["rest api", "restful", "api design", "swagger"],
        "Database Design": ["database design", "dbms", "normalization", "indexing"],
        "Agile": ["agile", "scrum", "sprint"],
        "Data Analysis": ["data analysis", "pandas", "numpy", "matplotlib", "tableau", "power bi"],
        "Computer Networks": ["networking", "tcp/ip", "http", "dns"],
        "OS": ["operating system", "os concepts", "process management", "threading"],
    }
}

ROLE_SKILL_REQUIREMENTS = {
    "SDE": {
        "required": ["DSA", "OOP", "Git", "REST APIs"],
        "preferred": ["System Design", "Docker", "AWS", "SQL"],
        "bonus": ["Kubernetes", "Kafka", "Redis"],
        "languages": ["Java", "Python", "JavaScript", "C++"],
        "frameworks": ["Spring Boot", "Django", "React"]
    },
    "Data Science": {
        "required": ["Python", "Machine Learning", "Data Analysis", "SQL"],
        "preferred": ["TensorFlow", "PyTorch", "Scikit-learn", "R"],
        "bonus": ["Kafka", "Elasticsearch", "AWS"],
        "languages": ["Python", "R", "SQL"],
        "frameworks": ["TensorFlow", "PyTorch", "Scikit-learn"]
    },
    "DevOps": {
        "required": ["Docker", "Linux", "Git", "AWS"],
        "preferred": ["Kubernetes", "Jenkins", "Kafka"],
        "bonus": ["Terraform", "Ansible", "Prometheus"],
        "languages": ["Python", "Go", "Bash"],
        "frameworks": []
    },
    "Frontend": {
        "required": ["JavaScript", "React", "Git"],
        "preferred": ["TypeScript", "Vue.js", "Next.js", "CSS"],
        "bonus": ["Angular", "Docker", "AWS"],
        "languages": ["JavaScript", "TypeScript"],
        "frameworks": ["React", "Angular", "Vue.js"]
    },
    "Backend": {
        "required": ["Java", "SQL", "REST APIs", "Git"],
        "preferred": ["Spring Boot", "Docker", "Redis", "System Design"],
        "bonus": ["Kafka", "Kubernetes", "AWS"],
        "languages": ["Java", "Python", "Go"],
        "frameworks": ["Spring Boot", "Django", "FastAPI"]
    }
}

# ─── Resume Analyzer Core ──────────────────────────────────────────────────────

class ResumeAnalyzer:
    """
    NLP-powered resume analyzer.
    Extracts skills, scores resume quality, and generates role-fit analysis.
    """

    def __init__(self):
        self.skill_taxonomy = SKILL_TAXONOMY
        self.role_requirements = ROLE_SKILL_REQUIREMENTS

    def extract_skills(self, text: str) -> Tuple[List[str], List[Dict]]:
        """Extract skills from resume text using pattern matching + taxonomy lookup."""
        text_lower = text.lower()
        found_skills = []
        skill_details = []

        for category, skills in self.skill_taxonomy.items():
            for skill_name, aliases in skills.items():
                for alias in aliases:
                    if alias in text_lower:
                        if skill_name not in found_skills:
                            found_skills.append(skill_name)
                            # Compute proficiency from context signals
                            proficiency = self._estimate_proficiency(text_lower, skill_name, aliases)
                            skill_details.append({
                                "name": skill_name,
                                "proficiency": proficiency,
                                "category": category
                            })
                        break

        return found_skills, skill_details

    def _estimate_proficiency(self, text: str, skill: str, aliases: List[str]) -> float:
        """Estimate proficiency level based on context signals."""
        score = 0.4  # baseline
        skill_lower = skill.lower()

        # Frequency signal
        count = sum(text.count(a) for a in aliases)
        score += min(0.2, count * 0.05)

        # Context signals
        proficiency_signals = {
            "expert": 0.35, "advanced": 0.3, "proficient": 0.25,
            "experienced": 0.2, "intermediate": 0.15, "familiar": 0.1,
            "basic": 0.05, "beginner": 0.0, "learning": 0.0,
            "years": 0.2, "production": 0.25, "deployed": 0.2
        }

        for signal, boost in proficiency_signals.items():
            # Check if signal appears near the skill
            pattern = rf'.{{0,50}}{re.escape(aliases[0])}.{{0,50}}'
            match = re.search(pattern, text, re.IGNORECASE)
            if match and signal in match.group():
                score += boost
                break

        return min(1.0, round(score, 2))

    def extract_education(self, text: str) -> Dict:
        """Extract education information."""
        education = {
            "degree": "Unknown",
            "branch": "Unknown",
            "cgpa": None,
            "year": None,
            "institution": "Unknown"
        }

        # Degree detection
        if re.search(r'\bb\.?tech\b|\bbackelor\s+of\s+tech', text, re.I):
            education["degree"] = "B.Tech"
        elif re.search(r'\bb\.?e\b|\bbachelor\s+of\s+eng', text, re.I):
            education["degree"] = "B.E"
        elif re.search(r'\bm\.?tech\b|\bmaster\s+of\s+tech', text, re.I):
            education["degree"] = "M.Tech"
        elif re.search(r'\bbca\b', text, re.I):
            education["degree"] = "BCA"
        elif re.search(r'\bmca\b', text, re.I):
            education["degree"] = "MCA"

        # Branch detection
        branches = {
            "Computer Science": [r'cs\b', r'cse\b', r'computer science', r'comp\.?\s*sci'],
            "Information Technology": [r'\bit\b', r'information tech'],
            "Electronics": [r'ece\b', r'electronics', r'electrical'],
            "Mechanical": [r'mechanical', r'mech\b'],
            "Data Science": [r'data science', r'ds\b'],
        }
        for branch, patterns in branches.items():
            if any(re.search(p, text, re.I) for p in patterns):
                education["branch"] = branch
                break

        # CGPA extraction
        cgpa_patterns = [
            r'cgpa[:\s]*(\d+\.?\d*)',
            r'gpa[:\s]*(\d+\.?\d*)',
            r'(\d+\.\d+)\s*(?:cgpa|gpa|out of 10)',
            r'aggregate[:\s]*(\d+\.?\d*)%?'
        ]
        for pattern in cgpa_patterns:
            match = re.search(pattern, text, re.I)
            if match:
                val = float(match.group(1))
                # Normalize percentage to 10-point scale
                if val > 10:
                    val = round(val / 10, 2)
                education["cgpa"] = min(10.0, val)
                break

        # Graduation year
        year_match = re.search(r'20(1[5-9]|2[0-9])', text)
        if year_match:
            education["year"] = int(year_match.group())

        return education

    def count_projects(self, text: str) -> Tuple[int, float]:
        """Count projects and estimate quality score."""
        project_indicators = [
            r'\bproject\b', r'\bbuilt\b', r'\bdeveloped\b',
            r'\bcreated\b', r'\bimplemented\b', r'\bdesigned\b'
        ]
        # Count project section entries
        project_count = 0
        lines = text.split('\n')
        in_project_section = False

        for line in lines:
            if re.search(r'project|work\s+experience|experience', line, re.I):
                in_project_section = True
            if in_project_section and re.search(r'^\s*[-•*]\s+\w', line):
                project_count += 1

        # Fallback: count indicator words
        if project_count == 0:
            indicators = sum(1 for p in project_indicators
                             if re.search(p, text, re.I))
            project_count = max(1, indicators // 2)

        # Quality signals
        quality_signals = {
            "github": 0.15, "deployed": 0.15, "production": 0.15,
            "users": 0.1, "api": 0.1, "database": 0.1,
            "performance": 0.08, "scalable": 0.08, "tested": 0.07,
            "docker": 0.07, "aws": 0.1, "real-time": 0.1
        }
        quality = 0.3  # baseline
        for signal, boost in quality_signals.items():
            if signal in text.lower():
                quality += boost

        return project_count, min(1.0, round(quality, 2))

    def determine_experience_level(self, text: str, skills: List[str]) -> str:
        """Determine experience level from resume signals."""
        text_lower = text.lower()

        # Years of experience
        years_match = re.search(r'(\d+)\+?\s*years?\s+(?:of\s+)?experience', text_lower)
        if years_match:
            years = int(years_match.group(1))
            if years >= 5:
                return "Senior"
            elif years >= 2:
                return "Mid-Level"
            elif years >= 1:
                return "Junior"

        # Keyword signals
        if any(w in text_lower for w in ["intern", "fresher", "fresh graduate", "recent graduate"]):
            return "Fresher"
        if re.search(r'senior|lead|architect|principal', text_lower):
            return "Senior"
        if re.search(r'junior|associate', text_lower):
            return "Junior"

        # Skill count heuristic
        if len(skills) >= 20:
            return "Mid-Level"
        elif len(skills) >= 10:
            return "Junior"
        return "Fresher"

    def compute_resume_score(
        self,
        skills: List[str],
        projects: int,
        project_quality: float,
        education: Dict,
        experience_level: str,
        text: str
    ) -> Tuple[float, List[str], List[str]]:
        """Compute comprehensive resume score with explanations."""

        component_scores = {}

        # 1. Skill Score (30%)
        skill_score = min(100, len(skills) * 5)
        has_advanced = any(s in skills for s in [
            "System Design", "Docker", "Kubernetes", "AWS", "Machine Learning"
        ])
        if has_advanced:
            skill_score = min(100, skill_score + 10)
        component_scores["skills"] = skill_score

        # 2. Project Score (25%)
        project_base = min(80, projects * 20)
        project_score = project_base + (project_quality * 20)
        component_scores["projects"] = min(100, project_score)

        # 3. Education Score (20%)
        edu_score = 50  # baseline
        if education.get("cgpa"):
            cgpa = education["cgpa"]
            edu_score = min(100, cgpa * 10)
        if education.get("degree") in ["M.Tech", "MCA"]:
            edu_score = min(100, edu_score + 10)
        component_scores["education"] = edu_score

        # 4. Structure Score (15%)
        structure_keywords = [
            "objective", "summary", "education", "experience",
            "skills", "projects", "achievements", "certifications",
            "contact", "email", "phone", "linkedin"
        ]
        text_lower = text.lower()
        structure_count = sum(1 for kw in structure_keywords if kw in text_lower)
        structure_score = min(100, structure_count * 8)
        component_scores["structure"] = structure_score

        # 5. Achievements & Extras (10%)
        extras = ["leetcode", "hackerrank", "codechef", "codeforces",
                  "kaggle", "hackathon", "open source", "publication",
                  "award", "certification", "coursera", "udemy"]
        extra_count = sum(1 for e in extras if e in text_lower)
        extra_score = min(100, extra_count * 15)
        component_scores["extras"] = extra_score

        # Weighted total
        weights = {"skills": 0.30, "projects": 0.25, "education": 0.20,
                   "structure": 0.15, "extras": 0.10}
        total = sum(component_scores[k] * weights[k] for k in weights)
        total = round(total, 1)

        # Strengths and improvements
        strengths, improvements = [], []

        if component_scores["skills"] >= 70:
            strengths.append(f"Strong skill set ({len(skills)} skills identified)")
        else:
            improvements.append("Add more relevant technical skills")

        if component_scores["projects"] >= 60:
            strengths.append(f"Good project portfolio ({projects} projects)")
        else:
            improvements.append("Add more impactful projects with deployment links")

        if component_scores["education"] >= 70:
            strengths.append("Strong academic background")
        else:
            improvements.append("Highlight academic achievements more clearly")

        if component_scores["structure"] >= 64:
            strengths.append("Well-structured resume")
        else:
            improvements.append("Improve resume structure (add missing sections)")

        if component_scores["extras"] >= 30:
            strengths.append("Good competitive programming / certification profile")
        else:
            improvements.append("Add certifications, competitive programming, or open source contributions")

        return total, strengths, improvements

    def compute_role_match(self, skills: List[str], cgpa: Optional[float]) -> Dict[str, float]:
        """Compute match percentage for each role."""
        role_scores = {}
        for role, reqs in self.role_requirements.items():
            required = reqs["required"]
            preferred = reqs.get("preferred", [])
            bonus = reqs.get("bonus", [])
            languages = reqs.get("languages", [])
            frameworks = reqs.get("frameworks", [])

            score = 0.0
            max_score = len(required) * 3 + len(preferred) * 1.5 + len(bonus) * 0.5 + \
                        len(languages) * 1 + len(frameworks) * 1

            for s in required:
                if s in skills: score += 3
            for s in preferred:
                if s in skills: score += 1.5
            for s in bonus:
                if s in skills: score += 0.5
            for s in languages:
                if s in skills: score += 1
            for s in frameworks:
                if s in skills: score += 1

            pct = round((score / max_score) * 100, 1) if max_score > 0 else 0
            role_scores[role] = min(100.0, pct)

        return role_scores

    def find_missing_skills(self, skills: List[str], target_role: str) -> List[str]:
        """Find critical missing skills for target role."""
        if target_role not in self.role_requirements:
            target_role = "SDE"

        reqs = self.role_requirements[target_role]
        missing = []
        for skill in reqs["required"]:
            if skill not in skills:
                missing.append(skill)
        for skill in reqs["preferred"][:3]:
            if skill not in skills and skill not in missing:
                missing.append(skill)

        return missing[:6]  # Top 6 missing

    def analyze(self, text: str, student_id: str, job_role: str = "SDE") -> Dict:
        """Full resume analysis pipeline."""
        start = time.time()

        if not text or len(text.strip()) < 50:
            raise ValueError("Resume text too short or empty")

        # Pipeline
        skills, skill_details = self.extract_skills(text)
        education = self.extract_education(text)
        projects, project_quality = self.count_projects(text)
        experience_level = self.determine_experience_level(text, skills)

        resume_score, strengths, improvements = self.compute_resume_score(
            skills, projects, project_quality, education, experience_level, text
        )

        role_match = self.compute_role_match(skills, education.get("cgpa"))
        missing_skills = self.find_missing_skills(skills, job_role)

        elapsed = round((time.time() - start) * 1000, 2)

        return {
            "student_id": student_id,
            "skills": skills,
            "skill_details": skill_details,
            "experience_level": experience_level,
            "education": education,
            "projects": projects,
            "project_quality_score": round(project_quality * 100, 1),
            "resume_score": resume_score,
            "missing_skills": missing_skills,
            "role_match": role_match,
            "strengths": strengths,
            "improvements": improvements,
            "processing_time_ms": elapsed
        }


# Singleton instance
_analyzer = ResumeAnalyzer()

def analyze_resume(text: str, student_id: str, job_role: str = "SDE") -> Dict:
    return _analyzer.analyze(text, student_id, job_role)
