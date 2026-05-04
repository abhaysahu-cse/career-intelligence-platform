import requests
import json
import time

API_BASE = "http://localhost:8080"
ML_BASE = "http://localhost:8000"

print("🚀 RUNNING FULL END-TO-END SYSTEM TEST")
print("========================================\n")

# 1. Test Auth
print("--- 1. Testing Auth Flow ---")
try:
    reg = requests.post(f"{API_BASE}/auth/signup", json={"name":"Abhay Sahu","email":"abhay.python@test.com","password":"Test@1234","role":"STUDENT"})
    print(f"Register: {reg.status_code}")
except Exception as e: print("Register error:", e)

token = None
try:
    login = requests.post(f"{API_BASE}/auth/login", json={"email":"abhay.python@test.com","password":"Test@1234"})
    print(f"Login: {login.status_code}")
    data = login.json()
    if 'data' in data and 'token' in data['data']:
        token = data['data']['token']
    elif 'token' in data:
        token = data['token']
    print(f"Token acquired: {'YES' if token else 'NO'}")
except Exception as e: print("Login error:", e)

headers = {"Authorization": f"Bearer {token}"} if token else {}

# 2. Test Resume Upload to ML directly (since Java API threw 500)
print("\n--- 2. Testing ML Resume Parsing ---")
try:
    with open("Abhay_Sahu_CV (1).pdf", "rb") as f:
        res = requests.post(f"{ML_BASE}/ml/resume/upload", params={"student_id":"8", "job_role":"Backend Developer"}, files={"file": f})
        print(f"ML Resume Parse Status: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            print(f"Extracted {len(data.get('skills', []))} skills. Top 3: {data.get('skills', [])[:3]}")
        else:
            print(res.text)
except Exception as e: print("ML Resume error:", e)

# 3. Test Interview Generation
print("\n--- 3. Testing ML Interview Question Generation ---")
try:
    q_data = {
        "resume_data": {"skills": ["Java", "Spring Boot", "Kafka"]},
        "job_role": "Backend Developer",
        "previous_answers": []
    }
    q_res = requests.post(f"{ML_BASE}/ml/interview/question", json=q_data)
    print(f"ML Question Gen Status: {q_res.status_code}")
    if q_res.status_code == 200:
        print(f"Question: {q_res.json().get('question')}")
except Exception as e: print("ML Question error:", e)

# 4. Test Interview Evaluation
print("\n--- 4. Testing ML Answer Evaluation ---")
try:
    e_data = {
        "student_id": "8",
        "question": "Explain REST API design principles",
        "answer_text": "REST is stateless, uses HTTP methods, and transfers JSON data.",
        "domain": "Backend Developer",
        "difficulty": "medium"
    }
    e_res = requests.post(f"{ML_BASE}/ml/interview/evaluate", json=e_data)
    print(f"ML Evaluate Status: {e_res.status_code}")
    if e_res.status_code == 200:
        d = e_res.json()
        print(f"Score: {d.get('overall_score')}, Feedback: {d.get('feedback')[:100]}...")
    else:
        print(e_res.text)
except Exception as e: print("ML Evaluate error:", e)

# 5. Test Jobs API
print("\n--- 5. Testing Job Service ---")
try:
    j_res = requests.get(f"{API_BASE}/jobs", headers=headers)
    print(f"Jobs API Status: {j_res.status_code}")
    if j_res.status_code == 200:
        jobs = j_res.json()
        print(f"Found {len(jobs)} jobs in database.")
    else:
        print(j_res.text)
except Exception as e: print("Jobs error:", e)

print("\n========================================")
print("TEST COMPLETED")
