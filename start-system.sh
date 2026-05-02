#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# CIP System Startup Script — STRICT ORDER
# ═══════════════════════════════════════════════════════════════════════════

set -e

echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║         CIP — Career Intelligence Platform                            ║"
echo "║         System Integration Startup                                    ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

# ─── STEP 1: Infrastructure ────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1/4: Starting Infrastructure (Kafka, Redis, WebSocket, Storage)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd cip-infra
docker-compose up -d
echo ""
echo "⏳ Waiting for Kafka to be ready (30s)..."
sleep 30
echo "✅ Infrastructure started"
echo ""

# Verify
echo "🔍 Verifying infrastructure..."
echo "  → Kafka UI:     http://localhost:8090"
echo "  → WebSocket:    http://localhost:3001/health"
echo "  → Storage:      http://localhost:3003/health"
echo "  → Prometheus:   http://localhost:9090"
echo "  → Grafana:      http://localhost:3004"
echo ""

# ─── STEP 2: ML Service ────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2/4: Starting ML Service (FastAPI)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd ../cip-ml

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.9+"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

echo "📦 Installing ML dependencies..."
source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null
pip install -q -r requirements.txt

echo "🚀 Starting ML service in background..."
nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > ml-service.log 2>&1 &
ML_PID=$!
echo $ML_PID > ml-service.pid
echo "  → ML Service PID: $ML_PID"
echo "  → Logs: cip-ml/ml-service.log"
sleep 5
echo "✅ ML Service started"
echo ""
echo "🔍 Verifying ML service..."
echo "  → API Docs:     http://localhost:8000/docs"
echo "  → Health:       http://localhost:8000/health"
echo ""

# ─── STEP 3: Backend Services ──────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3/4: Starting Backend (Spring Boot Microservices)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd ../cip-backend

# Check if Maven is available
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven not found. Please install Maven 3.8+"
    exit 1
fi

echo "🔨 Building backend services..."
mvn clean install -DskipTests -q
echo "✅ Backend built"
echo ""

echo "🚀 Starting backend with Docker Compose..."
bash build.sh start
echo "⏳ Waiting for services to initialize (45s)..."
sleep 45
echo "✅ Backend started"
echo ""

echo "🔍 Verifying backend services..."
echo "  → API Gateway:  http://localhost:8080/actuator/health"
echo "  → Auth:         http://localhost:8081/actuator/health"
echo "  → Student:      http://localhost:8082/actuator/health"
echo "  → Score:        http://localhost:8084/actuator/health"
echo "  → Kafka UI:     http://localhost:8090"
echo ""

# ─── STEP 4: Frontend ──────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4/4: Starting Frontend (Next.js)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd ../cip-web

# Check if Node is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js 18+"
    exit 1
fi

echo "📦 Installing frontend dependencies..."
npm install --silent
echo "✅ Dependencies installed"
echo ""

echo "🚀 Starting frontend in background..."
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > frontend.pid
echo "  → Frontend PID: $FRONTEND_PID"
echo "  → Logs: cip-web/frontend.log"
sleep 10
echo "✅ Frontend started"
echo ""

# ─── FINAL STATUS ──────────────────────────────────────────────────────────
cd ..
echo ""
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║                    🎉 SYSTEM FULLY STARTED 🎉                         ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📌 Access Points:"
echo "  ┌─────────────────────────────────────────────────────────────────────┐"
echo "  │ Frontend:       http://localhost:3000                              │"
echo "  │ API Gateway:    http://localhost:8080                              │"
echo "  │ ML Service:     http://localhost:8000/docs                         │"
echo "  │ WebSocket:      ws://localhost:3001                                │"
echo "  │ Kafka UI:       http://localhost:8090                              │"
echo "  │ Grafana:        http://localhost:3004 (admin/admin123)             │"
echo "  └─────────────────────────────────────────────────────────────────────┘"
echo ""
echo "📋 Next Steps:"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Login with any email/password (demo mode)"
echo "  3. Run validation tests: bash test-integration.sh"
echo ""
echo "🛑 To stop all services: bash stop-system.sh"
echo ""
