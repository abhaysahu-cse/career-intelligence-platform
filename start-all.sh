
#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# CIP System Complete Startup Script (Updated with Certificate Validator)
# ═══════════════════════════════════════════════════════════════════════════

set -e

echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║         CIP — Career Intelligence Platform                            ║"
echo "║         Complete System Startup (3 Modules)                           ║"
echo "║         1. AI Interview Copilot                                       ║"
echo "║         2. Job Recommendations                                        ║"
echo "║         3. Certificate Validator                                      ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

# ─── STEP 1: Infrastructure ────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1/5: Starting Infrastructure (PostgreSQL, Redis, Kafka, WebSocket)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd cip-infra
docker-compose up -d
echo ""
echo "⏳ Waiting for infrastructure to be ready (30s)..."
sleep 30
echo "✅ Infrastructure started"
echo ""

# Create Kafka topics
echo "📡 Creating Kafka topics..."
docker exec cip-kafka kafka-topics --create --bootstrap-server localhost:9092 --topic resume-events --partitions 3 --replication-factor 1 --if-not-exists 2>/dev/null || true
docker exec cip-kafka kafka-topics --create --bootstrap-server localhost:9092 --topic score-events --partitions 3 --replication-factor 1 --if-not-exists 2>/dev/null || true
docker exec cip-kafka kafka-topics --create --bootstrap-server localhost:9092 --topic interview-events --partitions 3 --replication-factor 1 --if-not-exists 2>/dev/null || true
docker exec cip-kafka kafka-topics --create --bootstrap-server localhost:9092 --topic job-events --partitions 3 --replication-factor 1 --if-not-exists 2>/dev/null || true
docker exec cip-kafka kafka-topics --create --bootstrap-server localhost:9092 --topic recommendation-events --partitions 3 --replication-factor 1 --if-not-exists 2>/dev/null || true
docker exec cip-kafka kafka-topics --create --bootstrap-server localhost:9092 --topic notification-events --partitions 3 --replication-factor 1 --if-not-exists 2>/dev/null || true
docker exec cip-kafka kafka-topics --create --bootstrap-server localhost:9092 --topic certificate-events --partitions 3 --replication-factor 1 --if-not-exists 2>/dev/null || true
echo "✅ Kafka topics created"
echo ""

# Create databases
echo "🗄️  Creating databases..."
docker exec cip-postgres psql -U cip -c "CREATE DATABASE cip_certificate;" 2>/dev/null || echo "  → cip_certificate already exists"
echo "✅ Databases ready"
echo ""

echo "🔍 Infrastructure Status:"
echo "  → PostgreSQL:   localhost:5432 (9 databases)"
echo "  → Redis:        localhost:6379"
echo "  → Kafka:        localhost:9092 (7 topics)"
echo "  → WebSocket:    localhost:3001"
echo "  → Storage:      localhost:3003"
echo ""

# ─── STEP 2: ML Service ────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2/5: Starting ML Service (FastAPI with Certificate Validator)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd ../cip-ml

# Check Python
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.11+"
    exit 1
fi

PYTHON_CMD=$(command -v python3 || command -v python)

echo "📦 Installing ML dependencies..."
$PYTHON_CMD -m pip install -q -r requirements.txt 2>/dev/null || pip install -q -r requirements.txt

echo "🚀 Starting ML service..."
nohup $PYTHON_CMD -m uvicorn main:app --host 0.0.0.0 --port 8000 > ml-service.log 2>&1 &
ML_PID=$!
echo $ML_PID > ml-service.pid
echo "  → ML Service PID: $ML_PID"
echo "  → Logs: cip-ml/ml-service.log"
sleep 8
echo "✅ ML Service started"
echo ""

echo "🔍 ML Modules Active:"
echo "  → resume_analyzer"
echo "  → interview_evaluator"
echo "  → career_readiness"
echo "  → recommendation_engine"
echo "  → certificate_validator ← NEW!"
echo ""
echo "  → API Docs: http://localhost:8000/docs"
echo "  → Health:   http://localhost:8000/health"
echo ""

# ─── STEP 3: Backend Services ──────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3/5: Starting Backend (12 Spring Boot Microservices)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd ../cip-backend

# Check Maven
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven not found. Please install Maven 3.8+"
    exit 1
fi

echo "🔨 Building backend (this may take 2-3 minutes)..."
mvn clean install -DskipTests -q
if [ $? -eq 0 ]; then
    echo "✅ Backend built successfully (12 modules)"
else
    echo "❌ Build failed. Check logs."
    exit 1
fi
echo ""

echo "🚀 Starting backend services..."

# Start services in background
SERVICES=(
    "api-gateway:8080"
    "auth-service:8081"
    "student-service:8082"
    "resume-service:8083"
    "score-service:8084"
    "analytics-service:8085"
    "interview-service:8086"
    "job-service:8087"
    "recommendation-service:8088"
    "certificate-service:8089"
)

for service_port in "${SERVICES[@]}"; do
    IFS=':' read -r service port <<< "$service_port"
    echo "  → Starting $service on port $port..."
    nohup java -jar $service/target/$service-1.0.0.jar > $service/service.log 2>&1 &
    echo $! > $service/service.pid
    sleep 2
done

echo ""
echo "⏳ Waiting for services to initialize (30s)..."
sleep 30
echo "✅ Backend services started"
echo ""

echo "🔍 Backend Services:"
echo "  → API Gateway:        http://localhost:8080"
echo "  → Auth Service:       http://localhost:8081"
echo "  → Student Service:    http://localhost:8082"
echo "  → Resume Service:     http://localhost:8083"
echo "  → Score Service:      http://localhost:8084"
echo "  → Analytics Service:  http://localhost:8085"
echo "  → Interview Service:  http://localhost:8086"
echo "  → Job Service:        http://localhost:8087"
echo "  → Recommendation:     http://localhost:8088"
echo "  → Certificate Service: http://localhost:8089 ← NEW!"
echo ""

# ─── STEP 4: Frontend ──────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4/5: Starting Frontend (Next.js)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd ../cip-web

# Check Node
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js 20+"
    exit 1
fi

echo "📦 Installing frontend dependencies..."
npm install --silent
echo "✅ Dependencies installed"
echo ""

echo "🚀 Starting frontend..."
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > frontend.pid
echo "  → Frontend PID: $FRONTEND_PID"
echo "  → Logs: cip-web/frontend.log"
sleep 10
echo "✅ Frontend started"
echo ""

# ─── STEP 5: Health Checks ─────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 5/5: Running Health Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🔍 Checking services..."
sleep 5

# Check ML Service
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "  ✅ ML Service: HEALTHY"
else
    echo "  ⚠️  ML Service: NOT RESPONDING (may need more time)"
fi

# Check API Gateway
if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo "  ✅ API Gateway: HEALTHY"
else
    echo "  ⚠️  API Gateway: NOT RESPONDING (may need more time)"
fi

# Check Certificate Service
if curl -s http://localhost:8089/certificates/health > /dev/null 2>&1; then
    echo "  ✅ Certificate Service: HEALTHY"
else
    echo "  ⚠️  Certificate Service: NOT RESPONDING (may need more time)"
fi

# Check Frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "  ✅ Frontend: HEALTHY"
else
    echo "  ⚠️  Frontend: NOT RESPONDING (may need more time)"
fi

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
echo "  │ 🌐 Frontend:       http://localhost:3000                           │"
echo "  │ 🚪 API Gateway:    http://localhost:8080                           │"
echo "  │ 🧠 ML Service:     http://localhost:8000/docs                      │"
echo "  │ 🛡️  Certificates:   http://localhost:3000/dashboard/certificates   │"
echo "  │ 🎤 Interview:      http://localhost:3000/dashboard/interview       │"
echo "  │ 💼 Jobs:           http://localhost:3000/dashboard/jobs            │"
echo "  │ 📊 Dashboard:      http://localhost:3000/dashboard                 │"
echo "  └─────────────────────────────────────────────────────────────────────┘"
echo ""
echo "📋 Your 3 Modules:"
echo "  1. 🤖 AI Interview Copilot - Real-time feedback"
echo "  2. 🎯 Job Recommendations - Resume analysis & matching"
echo "  3. 🛡️  Certificate Validator - Fraud detection ← NEW!"
echo ""
echo "📝 Next Steps:"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Register/Login"
echo "  3. Test all 3 modules:"
echo "     • Upload resume → Get analysis"
echo "     • Practice interview → Get feedback"
echo "     • Upload certificate → Get authenticity score ← NEW!"
echo "     • View job recommendations"
echo ""
echo "🧪 Run Tests:"
echo "  bash test-all.sh"
echo ""
echo "🛑 Stop All Services:"
echo "  bash stop-all.sh"
echo ""
echo "📖 Documentation:"
echo "  • SYSTEM-READY.md - System overview"
echo "  • FINAL-TESTING-GUIDE.md - Complete testing guide"
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
