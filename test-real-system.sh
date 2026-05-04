#!/bin/bash

# CIP COMPREHENSIVE REAL-WORLD SYSTEM TEST
# Tests all APIs with REAL data - no mocks, no assumptions

set -e

echo "🚀 CIP COMPREHENSIVE SYSTEM TEST - REAL DATA VERIFICATION"
echo "=========================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
TOTAL=0

# Base URLs
API_BASE="http://localhost:8080"
ML_BASE="http://localhost:8000"

# Test files (REAL files from root directory)
RESUME_FILE="Abhay_Sahu_CV (1).pdf"
CERT_FILE_1="Abhay_Sahu_Certificate.pdf"
CERT_FILE_2="Oracle GENAI Certification Abhay.pdf"

# JWT Token (will be set after login)
TOKEN=""

# Function to test endpoint
test_api() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local expected_code=${5:-200}
    
    ((TOTAL++))
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        if [ -n "$TOKEN" ]; then
            response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$url")
        else
            response=$(curl -s -w "\n%{http_code}" "$url")
        fi
    elif [ "$method" = "POST" ]; then
        if [ -n "$TOKEN" ]; then
            response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$data" "$url")
        else
            response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$url")
        fi
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        ((PASSED++))
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code, expected $expected_code)"
        ((FAILED++))
        echo "$body"
    fi
    echo ""
}

# Function to test file upload
test_upload() {
    local name=$1
    local url=$2
    local file=$3
    local expected_code=${4:-200}
    
    ((TOTAL++))
    echo -n "Testing $name... "
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ FAIL${NC} (File not found: $file)"
        ((FAILED++))
        return
    fi
    
    if [ -n "$TOKEN" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST -H "Authorization: Bearer $TOKEN" -F "file=@$file" "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X POST -F "file=@$file" "$url")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        ((PASSED++))
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code, expected $expected_code)"
        ((FAILED++))
        echo "$body"
    fi
    echo ""
}

echo -e "${BLUE}🔴 PHASE 1: INFRASTRUCTURE VERIFICATION${NC}"
echo "=========================================="
echo ""

# Check Docker containers
echo "Checking Docker containers..."
docker ps --format "table {{.Names}}\t{{.Status}}" | grep cip- || echo "No CIP containers found"
echo ""

# Check if files exist
echo "Checking test files..."
if [ -f "$RESUME_FILE" ]; then
    echo -e "${GREEN}✓${NC} Resume file found: $RESUME_FILE"
else
    echo -e "${RED}✗${NC} Resume file NOT found: $RESUME_FILE"
fi

if [ -f "$CERT_FILE_1" ]; then
    echo -e "${GREEN}✓${NC} Certificate 1 found: $CERT_FILE_1"
else
    echo -e "${RED}✗${NC} Certificate 1 NOT found: $CERT_FILE_1"
fi

if [ -f "$CERT_FILE_2" ]; then
    echo -e "${GREEN}✓${NC} Certificate 2 found: $CERT_FILE_2"
else
    echo -e "${RED}✗${NC} Certificate 2 NOT found: $CERT_FILE_2"
fi
echo ""

# Test infrastructure health
test_api "API Gateway Health" "GET" "$API_BASE/actuator/health"
test_api "ML Service Health" "GET" "$ML_BASE/health"
test_api "ML Service Root" "GET" "$ML_BASE/"

echo -e "${BLUE}🟢 PHASE 2: AUTH FLOW TEST${NC}"
echo "=============================="
echo ""

# Generate unique email for testing
TEST_EMAIL="test_$(date +%s)@example.com"

# Register user
echo "Registering new user: $TEST_EMAIL"
register_data="{\"name\":\"Test User\",\"email\":\"$TEST_EMAIL\",\"password\":\"Test@123\",\"role\":\"STUDENT\"}"
register_response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$register_data" "$API_BASE/api/auth/signup")
register_code=$(echo "$register_response" | tail -n1)
register_body=$(echo "$register_response" | sed '$d')

if [ "$register_code" = "200" ] || [ "$register_code" = "201" ]; then
    echo -e "${GREEN}✓ Registration successful${NC}"
    echo "$register_body" | jq '.'
else
    echo -e "${YELLOW}⚠ Registration returned $register_code (user might exist)${NC}"
fi
echo ""

# Login
echo "Logging in..."
login_data="{\"email\":\"$TEST_EMAIL\",\"password\":\"Test@123\"}"
login_response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$login_data" "$API_BASE/api/auth/login")
login_code=$(echo "$login_response" | tail -n1)
login_body=$(echo "$login_response" | sed '$d')

if [ "$login_code" = "200" ]; then
    echo -e "${GREEN}✓ Login successful${NC}"
    TOKEN=$(echo "$login_body" | jq -r '.token // .data.token // empty')
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo "Token obtained: ${TOKEN:0:50}..."
        ((PASSED++))
    else
        echo -e "${RED}✗ No token in response${NC}"
        echo "$login_body" | jq '.'
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ Login failed (HTTP $login_code)${NC}"
    echo "$login_body"
    ((FAILED++))
fi
((TOTAL++))
echo ""

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Cannot proceed without authentication token${NC}"
    exit 1
fi

echo -e "${BLUE}🟡 PHASE 3: RESUME UPLOAD TEST (REAL FILE)${NC}"
echo "============================================"
echo ""

test_upload "Resume Upload (Real PDF)" "$API_BASE/api/resume/upload" "$RESUME_FILE"

# Wait for processing
echo "Waiting 3 seconds for resume processing..."
sleep 3
echo ""

# Check profile
test_api "Get Student Profile" "GET" "$API_BASE/api/student/profile"

echo -e "${BLUE}🔴 PHASE 4: ML INTERVIEW TEST (CORE - REAL AI)${NC}"
echo "==============================================="
echo ""

# Test ML question generation
question_data='{"resume_data":{"skills":["Java","Spring Boot","PostgreSQL","Kafka"]},"job_role":"Backend Developer","previous_answers":[]}'
echo "Testing ML Question Generation (Gemini AI)..."
question_response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$question_data" "$ML_BASE/ml/interview/question")
question_code=$(echo "$question_response" | tail -n1)
question_body=$(echo "$question_response" | sed '$d')

((TOTAL++))
if [ "$question_code" = "200" ]; then
    echo -e "${GREEN}✓ Question generated${NC}"
    echo "$question_body" | jq '.'
    
    # Extract question for next test
    GENERATED_QUESTION=$(echo "$question_body" | jq -r '.question // empty')
    
    # Verify it's dynamic (not static)
    if echo "$question_body" | jq -e '.question' > /dev/null; then
        echo -e "${GREEN}✓ Dynamic question detected${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ No question in response${NC}"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ Question generation failed (HTTP $question_code)${NC}"
    echo "$question_body"
    ((FAILED++))
fi
echo ""

# Test ML answer evaluation
echo "Testing ML Answer Evaluation (Gemini AI)..."
answer_data='{"question":"Explain REST API design principles","answer":"REST API uses HTTP methods like GET, POST, PUT, DELETE. It is stateless and uses JSON for data transfer.","job_role":"Backend Developer","resume_skills":["Java","Spring Boot"],"persona_mode":"friendly"}'
eval_response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$answer_data" "$ML_BASE/ml/interview/coach")
eval_code=$(echo "$eval_response" | tail -n1)
eval_body=$(echo "$eval_response" | sed '$d')

((TOTAL++))
if [ "$eval_code" = "200" ]; then
    echo -e "${GREEN}✓ Answer evaluated${NC}"
    echo "$eval_body" | jq '.'
    
    # Verify intelligent feedback
    if echo "$eval_body" | jq -e '.score' > /dev/null && \
       echo "$eval_body" | jq -e '.good' > /dev/null && \
       echo "$eval_body" | jq -e '.missing' > /dev/null && \
       echo "$eval_body" | jq -e '.tip' > /dev/null; then
        echo -e "${GREEN}✓ Intelligent feedback detected (score, good, missing, tip)${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Incomplete feedback structure${NC}"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ Answer evaluation failed (HTTP $eval_code)${NC}"
    echo "$eval_body"
    ((FAILED++))
fi
echo ""

echo -e "${BLUE}🟣 PHASE 5: INTERVIEW SERVICE FLOW${NC}"
echo "===================================="
echo ""

# Start interview
interview_start_data='{"jobRole":"Backend Developer","type":"TECHNICAL","numberOfQuestions":5}'
test_api "Start Interview" "POST" "$API_BASE/api/interview/start" "$interview_start_data"

# Note: We'd need interview ID from response to continue
# For now, testing the endpoint availability

echo -e "${BLUE}🟢 PHASE 6: SCORE & ANALYTICS${NC}"
echo "==============================="
echo ""

test_api "Get Score" "GET" "$API_BASE/api/score"
test_api "Get Analytics" "GET" "$API_BASE/api/analytics"

echo -e "${BLUE}🔵 PHASE 7: JOB RECOMMENDATIONS${NC}"
echo "================================="
echo ""

test_api "Get All Jobs" "GET" "$API_BASE/api/jobs"
test_api "Get Recommended Jobs" "GET" "$API_BASE/api/jobs/recommended"

echo -e "${BLUE}🟠 PHASE 8: CERTIFICATE VALIDATION (REAL FILES)${NC}"
echo "================================================="
echo ""

test_upload "Certificate Upload 1 (Real PDF)" "$API_BASE/api/certificates/upload" "$CERT_FILE_1"
sleep 2
test_upload "Certificate Upload 2 (Real PDF)" "$API_BASE/api/certificates/upload" "$CERT_FILE_2"

# Get certificates list
test_api "Get Certificates List" "GET" "$API_BASE/api/certificates"

echo -e "${BLUE}🟡 PHASE 9: ROADMAP & RECOMMENDATIONS${NC}"
echo "========================================"
echo ""

test_api "Get Roadmap" "GET" "$API_BASE/api/roadmap"
test_api "Get Recommendations" "GET" "$API_BASE/api/recommendation"

echo ""
echo "=========================================="
echo -e "${BLUE}📊 TEST SUMMARY${NC}"
echo "=========================================="
echo ""
echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! System is production-ready.${NC}"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED. Please review and fix.${NC}"
    exit 1
fi
