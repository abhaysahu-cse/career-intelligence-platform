#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# CIP System Complete Shutdown Script
# ═══════════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║         CIP — Career Intelligence Platform                            ║"
echo "║         System Shutdown                                               ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

# ─── STEP 1: Stop Frontend ─────────────────────────────────────────────────
echo "🛑 Stopping Frontend..."
if [ -f "cip-web/frontend.pid" ]; then
    kill $(cat cip-web/frontend.pid) 2>/dev/null || true
    rm cip-web/frontend.pid
    echo "  ✅ Frontend stopped"
else
    echo "  ⚠️  Frontend PID not found"
fi
echo ""

# ─── STEP 2: Stop Backend Services ─────────────────────────────────────────
echo "🛑 Stopping Backend Services..."
cd cip-backend

SERVICES=(
    "api-gateway"
    "auth-service"
    "student-service"
    "resume-service"
    "score-service"
    "analytics-service"
    "interview-service"
    "job-service"
    "recommendation-service"
    "certificate-service"
)

for service in "${SERVICES[@]}"; do
    if [ -f "$service/service.pid" ]; then
        kill $(cat $service/service.pid) 2>/dev/null || true
        rm $service/service.pid
        echo "  ✅ $service stopped"
    fi
done

cd ..
echo ""

# ─── STEP 3: Stop ML Service ───────────────────────────────────────────────
echo "🛑 Stopping ML Service..."
if [ -f "cip-ml/ml-service.pid" ]; then
    kill $(cat cip-ml/ml-service.pid) 2>/dev/null || true
    rm cip-ml/ml-service.pid
    echo "  ✅ ML Service stopped"
else
    echo "  ⚠️  ML Service PID not found"
fi
echo ""

# ─── STEP 4: Stop Infrastructure ───────────────────────────────────────────
echo "🛑 Stopping Infrastructure..."
cd cip-infra
docker-compose down
cd ..
echo "  ✅ Infrastructure stopped"
echo ""

echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ SYSTEM FULLY STOPPED                            ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "To start again: bash start-all.sh"
echo ""
