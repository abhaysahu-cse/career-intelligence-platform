#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# CIP Build & Run Script
# Usage:
#   ./build.sh          → Build all services with Maven
#   ./build.sh docker   → Build Docker images
#   ./build.sh start    → Start everything with Docker Compose
#   ./build.sh stop     → Stop all containers
#   ./build.sh logs     → Tail logs
# ─────────────────────────────────────────────────────────────────────────────

set -e

SERVICES=(
  "common-lib"
  "api-gateway"
  "auth-service"
  "student-service"
  "resume-service"
  "score-service"
  "analytics-service"
  "interview-service"
  "job-service"
  "recommendation-service"
)

case "$1" in
  docker)
    echo "🐳 Building Docker images..."
    docker-compose build --parallel
    echo "✅ Docker images built"
    ;;
  start)
    echo "🚀 Starting CIP Platform..."
    docker-compose up -d
    echo ""
    echo "✅ Platform started!"
    echo ""
    echo "📌 Service URLs:"
    echo "  API Gateway      → http://localhost:8080"
    echo "  Auth Service     → http://localhost:8081"
    echo "  Student Service  → http://localhost:8082"
    echo "  Resume Service   → http://localhost:8083"
    echo "  Score Service    → http://localhost:8084"
    echo "  Analytics        → http://localhost:8085"
    echo "  Interview        → http://localhost:8086"
    echo "  Job Service      → http://localhost:8087"
    echo "  Recommendations  → http://localhost:8088"
    echo "  Kafka UI         → http://localhost:8090"
    ;;
  stop)
    echo "⏹ Stopping CIP Platform..."
    docker-compose down
    echo "✅ Stopped"
    ;;
  logs)
    docker-compose logs -f "${2:-api-gateway}"
    ;;
  clean)
    echo "🧹 Cleaning up..."
    docker-compose down -v --remove-orphans
    echo "✅ Cleaned"
    ;;
  *)
    echo "🔨 Building all services with Maven..."
    mvn clean install -DskipTests
    echo "✅ Build complete"
    ;;
esac
