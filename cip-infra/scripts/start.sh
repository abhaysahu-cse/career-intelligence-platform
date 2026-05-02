#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║       CIP Infrastructure — Startup Script               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Check prerequisites ───────────────────────────────────────
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || command -v docker compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required."; exit 1; }

# ── Copy .env if missing ──────────────────────────────────────
if [ ! -f .env ]; then
  echo "📋 .env not found — copying from .env.example"
  cp .env.example .env
  echo "⚠️  Please edit .env with your configuration, then re-run this script."
  echo ""
fi

# ── Detect docker compose command ────────────────────────────
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
else
  DC="docker-compose"
fi

echo "🐳 Using: $DC"
echo ""

# ── Pull base images ──────────────────────────────────────────
echo "📥 Pulling base images..."
$DC pull zookeeper kafka redis prometheus grafana 2>/dev/null || true

# ── Build custom services ─────────────────────────────────────
echo ""
echo "🔨 Building CIP services..."
$DC build --parallel

# ── Start infrastructure ──────────────────────────────────────
echo ""
echo "🚀 Starting infrastructure..."
$DC up -d

# ── Wait for Kafka ────────────────────────────────────────────
echo ""
echo "⏳ Waiting for Kafka to be healthy..."
attempt=0
max_attempts=30
until $DC exec kafka kafka-broker-api-versions --bootstrap-server localhost:9092 >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ $attempt -ge $max_attempts ]; then
    echo "❌ Kafka did not become healthy in time"
    $DC logs kafka
    exit 1
  fi
  echo "   Attempt $attempt/$max_attempts..."
  sleep 5
done
echo "✅ Kafka is healthy!"

# ── Show service status ───────────────────────────────────────
echo ""
echo "📊 Service status:"
$DC ps

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅  CIP Infrastructure is RUNNING                      ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  WebSocket Server:  ws://localhost:3001                  ║"
echo "║  Storage API:       http://localhost:3003                ║"
echo "║  Kafka UI:          http://localhost:8090                ║"
echo "║  Prometheus:        http://localhost:9090                ║"
echo "║  Grafana:           http://localhost:3004                ║"
echo "║  Schema Registry:   http://localhost:8081                ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
