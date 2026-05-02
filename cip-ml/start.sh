#!/bin/bash
# CIP ML Platform - Quick Start Script

echo "=================================="
echo " CIP ML Platform - Starting up..."
echo "=================================="

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 not found. Please install Python 3.9+"
    exit 1
fi

echo "[1/3] Installing dependencies..."
pip install -r requirements.txt -q

echo "[2/3] Running module tests..."
python3 -c "
import sys
sys.path.insert(0, '.')
from services.resume_analyzer.engine import analyze_resume
from services.academic_predictor.engine import predict_academic
from services.interview_evaluator.engine import evaluate_interview
from services.career_readiness.engine import compute_readiness, recommend_jobs
print('  ✓ Module 1: Resume Analyzer')
print('  ✓ Module 2: Academic Predictor')
print('  ✓ Module 3: Interview Evaluator')
print('  ✓ Module 4: Career Readiness')
print('  ✓ Module 5: Recommendation Engine')
"

echo "[3/3] Starting ML API server..."
echo ""
echo "  API:      http://localhost:8000"
echo "  Docs:     http://localhost:8000/docs"
echo "  Health:   http://localhost:8000/health"
echo ""
echo "  Press Ctrl+C to stop"
echo "=================================="

python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
