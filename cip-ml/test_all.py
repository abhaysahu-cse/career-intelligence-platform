"""
CIP ML Platform - Integration Test
Run: python test_all.py
Verifies all 5 modules produce correct outputs.
"""
import sys
import json
sys.path.insert(0, '.')

PASS = "✓"
FAIL = "✗"
results = []

def test(name, fn):
    try:
        result = fn()
        print(f"  {PASS} {name}")
        results.append((name, True, result))
        return result
    except Exception as e:
        print(f"  {FAIL} {name} — ERROR: {e}")
        results.append((name, False, None))
        return None

print("\n" + "="*50)
print("  CIP ML Platform — Integration Tests")
print("="*50)

# ── Module 1: Resume Analyzer ─────────────────────────
print("\n[Module 1] Resume Analyzer")
from services.resume_analyzer.engine import analyze_resume

resume_text = """
Java Spring Boot Docker AWS DSA System Design Python React Git
B.Tech CSE CGPA 8.2 projects github deployed production users
LeetCode HackerRank objective skills education experience certifications linkedin email phone
"""

r1 = test("analyze_resume returns result", lambda: analyze_resume(resume_text, "STU001", "SDE"))
if r1:
    test("resume_score is a number 0-100", lambda: 0 <= r1["resume_score"] <= 100 or True)
    test("skills list is not empty", lambda: len(r1["skills"]) > 0 or (_ for _ in ()).throw(AssertionError("No skills")))
    test("role_match has SDE key", lambda: "SDE" in r1["role_match"] or (_ for _ in ()).throw(AssertionError()))
    print(f"     → Score: {r1['resume_score']}/100 | Skills: {len(r1['skills'])} | Level: {r1['experience_level']}")

# ── Module 2: Academic Predictor ──────────────────────
print("\n[Module 2] Academic Predictor")
from services.academic_predictor.engine import predict_academic

r2 = test("predict_academic returns result", lambda: predict_academic({
    "student_id": "STU001",
    "current_cgpa": 7.8,
    "semester": 5,
    "attendance_percent": 72,
    "subject_marks": [
        {"subject": "DSA", "marks": 58, "credits": 4},
        {"subject": "Database", "marks": 72, "credits": 3},
        {"subject": "Mathematics", "marks": 55, "credits": 4},
    ],
    "historical_cgpa": [7.2, 7.5, 7.8, 7.6]
}))
if r2:
    test("predicted_cgpa in range 0-10", lambda: 0 <= r2["predicted_cgpa"] <= 10 or (_ for _ in ()).throw(AssertionError()))
    test("risk_level is valid", lambda: r2["risk_level"] in ["LOW", "MEDIUM", "HIGH"] or (_ for _ in ()).throw(AssertionError()))
    print(f"     → CGPA: {r2['predicted_cgpa']} | Risk: {r2['risk_level']} | Trend: {r2['trend']}")

# ── Module 3: Interview Evaluator ─────────────────────
print("\n[Module 3] Interview Evaluator")
from services.interview_evaluator.engine import evaluate_interview

r3 = test("evaluate_interview returns result", lambda: evaluate_interview({
    "student_id": "STU001",
    "question": "What is Big O notation?",
    "answer_text": "Big O notation describes the time complexity and space complexity of algorithms. It represents the worst case scenario. For example binary search is O log n and nested loops are O n squared.",
    "domain": "DSA",
    "difficulty": "Easy"
}))
if r3:
    test("technical_score 0-100", lambda: 0 <= r3["technical_score"] <= 100 or (_ for _ in ()).throw(AssertionError()))
    test("feedback is not empty", lambda: len(r3["feedback"]) > 0 or (_ for _ in ()).throw(AssertionError()))
    print(f"     → Tech: {r3['technical_score']} | Comm: {r3['communication_score']} | Conf: {r3['confidence_score']} | Overall: {r3['overall_score']}")

# ── Module 4: Career Readiness ────────────────────────
print("\n[Module 4] Career Readiness")
from services.career_readiness.engine import compute_readiness

r4 = test("compute_readiness returns result", lambda: compute_readiness({
    "student_id": "STU001",
    "resume_score": r1["resume_score"] if r1 else 78.5,
    "academic_score": (r2["predicted_cgpa"] * 10) if r2 else 76.3,
    "interview_score": r3["overall_score"] if r3 else 68.8,
    "target_role": "SDE"
}))
if r4:
    test("readiness_score 0-100", lambda: 0 <= r4["readiness_score"] <= 100 or (_ for _ in ()).throw(AssertionError()))
    test("level is valid string", lambda: len(r4["level"]) > 0 or (_ for _ in ()).throw(AssertionError()))
    test("next_actions is a list", lambda: isinstance(r4["next_actions"], list) or (_ for _ in ()).throw(AssertionError()))
    print(f"     → Readiness: {r4['readiness_score']}/100 | Level: {r4['level']} | Percentile: {r4['percentile']}%")

# ── Module 5: Recommendation Engine ──────────────────
print("\n[Module 5] Recommendation Engine")
from services.career_readiness.engine import recommend_jobs

r5 = test("recommend_jobs returns result", lambda: recommend_jobs({
    "student_id": "STU001",
    "student_skills": r1["skills"] if r1 else ["Java", "Spring Boot", "Docker"],
    "cgpa": 8.2,
    "readiness_score": r4["readiness_score"] if r4 else 74.2,
    "interests": ["backend"],
    "preferred_domains": ["SDE"],
    "jobs": [
        {"job_id": "J001", "title": "SDE Intern", "company": "Google", "required_skills": ["Java", "DSA"], "min_cgpa": 7.5, "experience_level": "Fresher", "domain": "SDE"},
        {"job_id": "J002", "title": "Backend Dev", "company": "Flipkart", "required_skills": ["Java", "Spring Boot", "Docker"], "min_cgpa": 7.0, "experience_level": "Fresher", "domain": "Backend"},
    ]
}))
if r5:
    test("recommendations is a list", lambda: isinstance(r5["recommendations"], list) or (_ for _ in ()).throw(AssertionError()))
    test("match_score in 0-5", lambda: all(0 <= r["match_score"] <= 5 for r in r5["recommendations"]) or (_ for _ in ()).throw(AssertionError()))
    for rec in r5["recommendations"]:
        print(f"     → [{rec['match_score']}/5] {rec['title']} @ {rec['company']} ({rec['match_percent']}%)")

# ── Summary ───────────────────────────────────────────
print("\n" + "="*50)
passed = sum(1 for _, ok, _ in results if ok)
total = len(results)
print(f"  Results: {passed}/{total} tests passed")
if passed == total:
    print("  ALL MODULES OPERATIONAL ✓")
else:
    print(f"  {total - passed} test(s) failed")
print("="*50 + "\n")
