#!/bin/bash
echo "🛑 Stopping CIP Infrastructure..."
if docker compose version >/dev/null 2>&1; then
  docker compose down "$@"
else
  docker-compose down "$@"
fi
echo "✅ All services stopped."
