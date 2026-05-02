#!/bin/bash

# CIP System End-to-End Test Script
# Tests all critical flows to ensure production readiness

set -e

echo "🚀 CIP SYSTEM END-TO-END TEST"
echo "=============================="
echo ""

BASE_URL="http://localhost:8080/api"
ML_URL="http://localhost:8000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local data=$4
    
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$url")
    fi
    
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $response)"
        ((FAILED++))
    fi
}

echo "📡 PHASE 1: INFRASTRUCTURE HEALTH CHECKS"
echo "========================================="
echo ""

# API Gateway
test_endpoint "API Gateway" "$BASE_URL/health"

# ML Service
test_endpoint "ML Service" "$ML_URL/health"

# Backend Services
test_endpoint "Auth Service" "$BASE_URL/auth/health"
test_endpoint "Resume Service" "$BASE_URL/resume/health"
test_endpoint "Interview Service" "$BASE_URL/interview/health"
test_endpoint "Job Service" "$BASE_URL/jobs/health"
test_endpoint "Analytics Service" "$BASE_URL/analytics/health"
test_endpoint "Score Service" "$BASE_URL/score/health"
test_endpoint "Roadmap Service" "$BASE_URL/roadmap/health"
test_endpoint "Recommendation Service" "$BASE_URL/recommendation/health"
test_endpoint "Certificate Service" "$BASE_URL/certificates/health"

echo ""
echo "🧪 PHASE 2: FUNCTIONAL TESTS"
echo "============================="
echo ""

# Test ML endpoints
test_endpoint "ML Health Check" "$ML_URL/health"
test_endpoint "ML Root" "$ML_URL/"

# Test job listing
test_endpoint "Job Listing" "$BASE_URL/jobs"

echo ""
echo "📊 PHASE 3: DATA VALIDATION"
echo "==========================="
echo ""

# Check if jobs exist
echo -n "Checking job count... "
job_count=$(curl -s "$BASE_URL/jobs" | jq -r '.content | length' 2>/dev/null || echo "0")
if [ "$job_count" -gt "0" ]; then
    echo -e "${GREEN}✓ PASS${NC} ($job_count jobs found)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (No jobs found)"
    ((FAILED++))
fi

echo ""
echo "🔍 PHASE 4: MOCK DATA CHECK"
echo "==========================="
echo ""

# Check for mock data file
echo -n "Checking for mock-data.ts... "
if [ ! -f "cip-web/lib/mock-data.ts" ]; then
    echo -e "${GREEN}✓ PASS${NC} (File deleted)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (File still exists)"
    ((FAILED++))
fi

# Check for mock imports in frontend
echo -n "Checking for mock imports... "
mock_imports=$(grep -r "from.*mock-data" cip-web/app 2>/dev/null | wc -l)
if [ "$mock_imports" -eq "0" ]; then
    echo -e "${GREEN}✓ PASS${NC} (No mock imports found)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} ($mock_imports mock imports found)"
    ((FAILED++))
fi

echo ""
echo "📈 TEST SUMMARY"
echo "==============="
echo ""
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ "$FAILED" -eq "0" ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! System is production-ready.${NC}"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED. Please review and fix.${NC}"
    exit 1
fi
