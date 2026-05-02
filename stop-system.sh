#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# CIP System Shutdown Script
# ═══════════════════════════════════════════════════════════════════════════

echo "🛑 Stopping CIP System..."
echo ""

# Stop Frontend
if [ -f "cip-web/frontend.pid" ]; then
    echo "⏹  Stopping Frontend..."
    kill $(cat cip-web/frontend.pid) 2>/dev/null || true
    rm cip-web/frontend.pid
fi

# Stop ML Service
if [ -f "cip-ml/ml-service.pid" ]; then
    echo "⏹  Stopping ML Service..."
    kill $(cat cip-ml/ml-service.pid) 2>/dev/null || true
    rm cip-ml/ml-service.pid
fi

# Stop Backend
echo "⏹  Stopping Backend Services..."
cd cip-backend
bash build.sh stop
cd ..

# Stop Infrastructure
echo "⏹  Stopping Infrastructure..."
cd cip-infra
docker-compose down
cd ..

echo ""
echo "✅ All services stopped"
