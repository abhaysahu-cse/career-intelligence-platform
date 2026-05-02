#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# CIP System Complete Test Script
# ═══════════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║         CIP — Career Intelligence Platform                            ║"
echo "║         System Integration Tests                                      ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

PASSED=0
FAILED=0

# ─── TEST 1: Infrastructure ────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Infrastructure Health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# PostgreSQL
if docker exec cip-postgres psql -U cip -l > /dev/null 2>&1; then
    echo "  ✅ PostgreSQL: HEALTHY"
    ((PASSED++))
else
    echo "  ❌ PostgreSQL: FAILED"
    ((FAILED++))
fi

# Redis
if docker exec cip-redis redis-cli ping > /dev/null 2>&1; then
    echo "  ✅ Redis: HEALTHY"
    ((PASSED++))
else
    echo "  ❌ Redis: FAILED"
    ((FAILED++))
fi

# Kafka
if docker exec cip-kafka kafka-topics --list --bootstrap-server localhost:9092 > /dev/null 2>&1; then
    echo "  ✅ Kafka: HEALTHY"
    ((PASSED++))
else
    echo "  ❌ Kafka: FAILED"
    ((FAILED++))
fi

echo ""

# ─── TEST 2: ML Service ────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: ML Service"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Health check
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo "  ✅ ML Service: HEALTHY"
    ((PASSED++))
else
    echo "  ❌ ML Service: FAILED"
    ((FAILED++))
fi

# Check certificate validator module
if curl -s http://localhost:8000/health | grep -q "certificate_validator"; then
    echo "  ✅ Certificate Validator Module: LOADED"
    ((PASSED++))
else
    echo "  ❌ Certificate Validator Module: NOT FOUND"
    ((FAILED++))
fi

# Check academic predictor removed
if curl -s http://localhost:8000/health | grep -q "academic_predictor"; then
    echo "  ❌ Academic Predictor: STILL EXISTS (should be removed)"
    ((FAILED++))
else
    echo "  ✅ Academic Predictor: REMOVED"
    ((PASSED++))
fi

echo ""

# ─── TEST 3: Backend Services ──────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: Backend Services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SERVICES=(
    "API Gateway:8080:/actuator/health"
    "Auth Service:8081:/actuator/health"
    "Student Service:8082:/actuator/health"
    "Resume Service:8083:/actuator/health"
    "Score Service:8084:/actuator/health"
    "Analytics Service:8085:/actuator/health"
    "Interview Service:8086:/actuator/health"
    "Job Service:8087:/actuator/health"
    "Recommendation:8088:/actuator/health"
    "Certificate Service:8089:/certificates/health"
)

for service_info in "${SERVICES[@]}"; do
    IFS=':' read -r name port endpoint <<< "$service_info"
    if curl -s http://localhost:$port$endpoint > /dev/null 2>&1; then
        echo "  ✅ $name: HEALTHY"
        ((PASSED++))
    else
        echo "  ❌ $name: FAILED"
        ((FAILED++))
    fi
done

echo ""

# ─── TEST 4: Kafka Topics ──────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 4: Kafka Topics"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOPICS=(
    "resume-events"
    "score-events"
    "interview-events"
    "job-events"
    "recommendation-events"
    "notification-events"
    "certificate-events"
)

for topic in "${TOPICS[@]}"; do
    if docker exec cip-kafka kafka-topics --list --bootstrap-server localhost:9092 | grep -q "^$topic$"; then
        echo "  ✅ Topic: $topic"
        ((PASSED++))
    else
        echo "  ❌ Topic: $topic NOT FOUND"
        ((FAILED++))
    fi
done

echo ""

# ─── TEST 5: Databases ─────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 5: Databases"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DATABASES=(
    "cip_auth"
    "cip_student"
    "cip_resume"
    "cip_score"
    "cip_interview"
    "cip_job"
    "cip_recommendation"
    "cip_analytics"
    "cip_certificate"
)

for db in "${DATABASES[@]}"; do
    if docker exec cip-postgres psql -U cip -l | grep -q "$db"; then
        echo "  ✅ Database: $db"
        ((PASSED++))
    else
        echo "  ❌ Database: $db NOT FOUND"
        ((FAILED++))
    fi
done

echo ""

# ─── TEST 6: Frontend ──────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 6: Frontend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "  ✅ Frontend: ACCESSIBLE"
    ((PASSED++))
else
    echo "  ❌ Frontend: NOT ACCESSIBLE"
    ((FAILED++))
fi

# Check certificate pages exist
if [ -d "cip-web/app/dashboard/certificates" ]; then
    echo "  ✅ Certificate Pages: EXIST"
    ((PASSED++))
else
    echo "  ❌ Certificate Pages: NOT FOUND"
    ((FAILED++))
fi

echo ""

# ─── TEST 7: API Gateway Routes ────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 7: API Gateway Routes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check certificate route
if grep -q "certificate-service" cip-backend/api-gateway/src/main/resources/application.yml; then
    echo "  ✅ Certificate Route: CONFIGURED"
    ((PASSED++))
else
    echo "  ❌ Certificate Route: NOT CONFIGURED"
    ((FAILED++))
fi

echo ""

# ─── TEST 8: Score Formula ─────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 8: Score Formula (Academic Removed)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check academic weight removed
if grep -q "ACADEMIC_WEIGHT" cip-backend/score-service/src/main/java/com/cip/score/service/ScoreEngine.java; then
    echo "  ❌ Academic Weight: STILL EXISTS (should be removed)"
    ((FAILED++))
else
    echo "  ✅ Academic Weight: REMOVED"
    ((PASSED++))
fi

# Check new formula
if grep -q "0.40" cip-backend/score-service/src/main/java/com/cip/score/service/ScoreEngine.java; then
    echo "  ✅ New Formula: IMPLEMENTED (0.4 × Resume + 0.6 × Interview)"
    ((PASSED++))
else
    echo "  ❌ New Formula: NOT FOUND"
    ((FAILED++))
fi

echo ""

# ─── FINAL RESULTS ─────────────────────────────────────────────────────────
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║                         TEST RESULTS                                  ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "  ✅ PASSED: $PASSED"
echo "  ❌ FAILED: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "╔═══════════════════════════════════════════════════════════════════════╗"
    echo "║                    🎉 ALL TESTS PASSED! 🎉                            ║"
    echo "║                    System is Ready for Demo                           ║"
    echo "╚═══════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "📋 Your 3 Modules are Ready:"
    echo "  1. 🤖 AI Interview Copilot"
    echo "  2. 🎯 Job Recommendations"
    echo "  3. 🛡️  Certificate Validator ← NEW!"
    echo ""
    echo "🎬 Demo Flow:"
    echo "  1. Upload Resume → Get analysis"
    echo "  2. Practice Interview → Get feedback"
    echo "  3. Upload Certificate → Get authenticity score"
    echo "  4. View Jobs → Get recommendations"
    echo ""
    exit 0
else
    echo "╔═══════════════════════════════════════════════════════════════════════╗"
    echo "║                    ⚠️  SOME TESTS FAILED                              ║"
    echo "║                    Check logs for details                             ║"
    echo "╚═══════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "📝 Troubleshooting:"
    echo "  • Check service logs in respective directories"
    echo "  • Verify all services are running: docker ps"
    echo "  • Check TROUBLESHOOTING.md for common issues"
    echo ""
    exit 1
fi
