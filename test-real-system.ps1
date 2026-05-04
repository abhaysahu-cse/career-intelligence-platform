# CIP COMPREHENSIVE REAL-WORLD SYSTEM TEST (PowerShell)
# Tests all APIs with REAL data - no mocks, no assumptions

Write-Host "🚀 CIP COMPREHENSIVE SYSTEM TEST - REAL DATA VERIFICATION" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Test counters
$script:PASSED = 0
$script:FAILED = 0
$script:TOTAL = 0

# Base URLs
$API_BASE = "http://localhost:8080"
$ML_BASE = "http://localhost:8000"

# Test files (REAL files from root directory)
$RESUME_FILE = "Abhay_Sahu_CV (1).pdf"
$CERT_FILE_1 = "Abhay_Sahu_Certificate.pdf"
$CERT_FILE_2 = "Oracle GENAI Certification Abhay.pdf"

# JWT Token (will be set after login)
$script:TOKEN = ""

# Function to test API endpoint
function Test-API {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [string]$Data = "",
        [int]$ExpectedCode = 200
    )
    
    $script:TOTAL++
    Write-Host "Testing $Name... " -NoNewline
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($script:TOKEN) {
            $headers["Authorization"] = "Bearer $($script:TOKEN)"
        }
        
        if ($Method -eq "GET") {
            $response = Invoke-WebRequest -Uri $Url -Method Get -Headers $headers -UseBasicParsing -ErrorAction Stop
        }
        elseif ($Method -eq "POST") {
            $response = Invoke-WebRequest -Uri $Url -Method Post -Headers $headers -Body $Data -UseBasicParsing -ErrorAction Stop
        }
        
        if ($response.StatusCode -eq $ExpectedCode) {
            Write-Host "✓ PASS" -ForegroundColor Green -NoNewline
            Write-Host " (HTTP $($response.StatusCode))" -ForegroundColor Gray
            $script:PASSED++
            
            # Try to parse and display JSON
            try {
                $json = $response.Content | ConvertFrom-Json
                $json | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray
            }
            catch {
                Write-Host $response.Content -ForegroundColor Gray
            }
        }
        else {
            Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
            Write-Host " (HTTP $($response.StatusCode), expected $ExpectedCode)" -ForegroundColor Gray
            $script:FAILED++
        }
    }
    catch {
        Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
        Write-Host " ($($_.Exception.Message))" -ForegroundColor Gray
        $script:FAILED++
    }
    
    Write-Host ""
}

# Function to test file upload
function Test-Upload {
    param(
        [string]$Name,
        [string]$Url,
        [string]$FilePath,
        [int]$ExpectedCode = 200
    )
    
    $script:TOTAL++
    Write-Host "Testing $Name... " -NoNewline
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
        Write-Host " (File not found: $FilePath)" -ForegroundColor Gray
        $script:FAILED++
        Write-Host ""
        return
    }
    
    try {
        $boundary = [System.Guid]::NewGuid().ToString()
        $fileBytes = [System.IO.File]::ReadAllBytes($FilePath)
        $fileName = [System.IO.Path]::GetFileName($FilePath)
        
        $bodyLines = @(
            "--$boundary",
            "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
            "Content-Type: application/octet-stream",
            "",
            [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileBytes),
            "--$boundary--"
        )
        
        $body = $bodyLines -join "`r`n"
        
        $headers = @{
            "Content-Type" = "multipart/form-data; boundary=$boundary"
        }
        
        if ($script:TOKEN) {
            $headers["Authorization"] = "Bearer $($script:TOKEN)"
        }
        
        $response = Invoke-WebRequest -Uri $Url -Method Post -Headers $headers -Body $body -UseBasicParsing -ErrorAction Stop
        
        if ($response.StatusCode -eq $ExpectedCode) {
            Write-Host "✓ PASS" -ForegroundColor Green -NoNewline
            Write-Host " (HTTP $($response.StatusCode))" -ForegroundColor Gray
            $script:PASSED++
            
            try {
                $json = $response.Content | ConvertFrom-Json
                $json | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray
            }
            catch {
                Write-Host $response.Content -ForegroundColor Gray
            }
        }
        else {
            Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
            Write-Host " (HTTP $($response.StatusCode), expected $ExpectedCode)" -ForegroundColor Gray
            $script:FAILED++
        }
    }
    catch {
        Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
        Write-Host " ($($_.Exception.Message))" -ForegroundColor Gray
        $script:FAILED++
    }
    
    Write-Host ""
}

Write-Host "🔴 PHASE 1: INFRASTRUCTURE VERIFICATION" -ForegroundColor Blue
Write-Host "==========================================" -ForegroundColor Blue
Write-Host ""

# Check Docker containers
Write-Host "Checking Docker containers..." -ForegroundColor Yellow
docker ps --format "table {{.Names}}\t{{.Status}}" | Select-String "cip-"
Write-Host ""

# Check if files exist
Write-Host "Checking test files..." -ForegroundColor Yellow
if (Test-Path $RESUME_FILE) {
    Write-Host "✓ Resume file found: $RESUME_FILE" -ForegroundColor Green
} else {
    Write-Host "✗ Resume file NOT found: $RESUME_FILE" -ForegroundColor Red
}

if (Test-Path $CERT_FILE_1) {
    Write-Host "✓ Certificate 1 found: $CERT_FILE_1" -ForegroundColor Green
} else {
    Write-Host "✗ Certificate 1 NOT found: $CERT_FILE_1" -ForegroundColor Red
}

if (Test-Path $CERT_FILE_2) {
    Write-Host "✓ Certificate 2 found: $CERT_FILE_2" -ForegroundColor Green
} else {
    Write-Host "✗ Certificate 2 NOT found: $CERT_FILE_2" -ForegroundColor Red
}
Write-Host ""

# Test infrastructure health
Test-API -Name "API Gateway Health" -Method "GET" -Url "$API_BASE/actuator/health"
Test-API -Name "ML Service Health" -Method "GET" -Url "$ML_BASE/health"
Test-API -Name "ML Service Root" -Method "GET" -Url "$ML_BASE/"

Write-Host "🟢 PHASE 2: AUTH FLOW TEST" -ForegroundColor Blue
Write-Host "==============================" -ForegroundColor Blue
Write-Host ""

# Generate unique email for testing
$TEST_EMAIL = "test_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"

# Register user
Write-Host "Registering new user: $TEST_EMAIL" -ForegroundColor Yellow
$registerData = @{
    name = "Test User"
    email = $TEST_EMAIL
    password = "Test@123"
    role = "STUDENT"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-WebRequest -Uri "$API_BASE/api/auth/signup" -Method Post -Body $registerData -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Registration successful" -ForegroundColor Green
    $registerResponse.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray
}
catch {
    Write-Host "⚠ Registration returned error (user might exist)" -ForegroundColor Yellow
}
Write-Host ""

# Login
Write-Host "Logging in..." -ForegroundColor Yellow
$loginData = @{
    email = $TEST_EMAIL
    password = "Test@123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$API_BASE/api/auth/login" -Method Post -Body $loginData -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
    
    if ($loginResponse.StatusCode -eq 200) {
        Write-Host "✓ Login successful" -ForegroundColor Green
        $loginJson = $loginResponse.Content | ConvertFrom-Json
        
        # Try different token paths
        $script:TOKEN = $loginJson.token
        if (-not $script:TOKEN) {
            $script:TOKEN = $loginJson.data.token
        }
        
        if ($script:TOKEN) {
            Write-Host "Token obtained: $($script:TOKEN.Substring(0, [Math]::Min(50, $script:TOKEN.Length)))..." -ForegroundColor Gray
            $script:PASSED++
        }
        else {
            Write-Host "✗ No token in response" -ForegroundColor Red
            $loginJson | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray
            $script:FAILED++
        }
    }
    $script:TOTAL++
}
catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    $script:FAILED++
    $script:TOTAL++
}
Write-Host ""

if (-not $script:TOKEN) {
    Write-Host "Cannot proceed without authentication token" -ForegroundColor Red
    exit 1
}

Write-Host "🟡 PHASE 3: RESUME UPLOAD TEST (REAL FILE)" -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""

Test-Upload -Name "Resume Upload (Real PDF)" -Url "$API_BASE/api/resume/upload" -FilePath $RESUME_FILE

Write-Host "Waiting 3 seconds for resume processing..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Write-Host ""

Test-API -Name "Get Student Profile" -Method "GET" -Url "$API_BASE/api/student/profile"

Write-Host "🔴 PHASE 4: ML INTERVIEW TEST (CORE - REAL AI)" -ForegroundColor Blue
Write-Host "===============================================" -ForegroundColor Blue
Write-Host ""

# Test ML question generation
$questionData = @{
    resume_data = @{
        skills = @("Java", "Spring Boot", "PostgreSQL", "Kafka")
    }
    job_role = "Backend Developer"
    previous_answers = @()
} | ConvertTo-Json -Depth 3

Write-Host "Testing ML Question Generation (Gemini AI)..." -ForegroundColor Yellow
Test-API -Name "Generate Question" -Method "POST" -Url "$ML_BASE/ml/interview/question" -Data $questionData

# Test ML answer evaluation
$answerData = @{
    question = "Explain REST API design principles"
    answer = "REST API uses HTTP methods like GET, POST, PUT, DELETE. It is stateless and uses JSON for data transfer."
    job_role = "Backend Developer"
    resume_skills = @("Java", "Spring Boot")
    persona_mode = "friendly"
} | ConvertTo-Json -Depth 3

Write-Host "Testing ML Answer Evaluation (Gemini AI)..." -ForegroundColor Yellow
Test-API -Name "Evaluate Answer" -Method "POST" -Url "$ML_BASE/ml/interview/coach" -Data $answerData

Write-Host "🟣 PHASE 5: INTERVIEW SERVICE FLOW" -ForegroundColor Blue
Write-Host "====================================" -ForegroundColor Blue
Write-Host ""

$interviewStartData = @{
    jobRole = "Backend Developer"
    type = "TECHNICAL"
    numberOfQuestions = 5
} | ConvertTo-Json

Test-API -Name "Start Interview" -Method "POST" -Url "$API_BASE/api/interview/start" -Data $interviewStartData

Write-Host "🟢 PHASE 6: SCORE & ANALYTICS" -ForegroundColor Blue
Write-Host "===============================" -ForegroundColor Blue
Write-Host ""

Test-API -Name "Get Score" -Method "GET" -Url "$API_BASE/api/score"
Test-API -Name "Get Analytics" -Method "GET" -Url "$API_BASE/api/analytics"

Write-Host "🔵 PHASE 7: JOB RECOMMENDATIONS" -ForegroundColor Blue
Write-Host "=================================" -ForegroundColor Blue
Write-Host ""

Test-API -Name "Get All Jobs" -Method "GET" -Url "$API_BASE/api/jobs"
Test-API -Name "Get Recommended Jobs" -Method "GET" -Url "$API_BASE/api/jobs/recommended"

Write-Host "🟠 PHASE 8: CERTIFICATE VALIDATION (REAL FILES)" -ForegroundColor Blue
Write-Host "=================================================" -ForegroundColor Blue
Write-Host ""

Test-Upload -Name "Certificate Upload 1 (Real PDF)" -Url "$API_BASE/api/certificates/upload" -FilePath $CERT_FILE_1
Start-Sleep -Seconds 2
Test-Upload -Name "Certificate Upload 2 (Real PDF)" -Url "$API_BASE/api/certificates/upload" -FilePath $CERT_FILE_2

Test-API -Name "Get Certificates List" -Method "GET" -Url "$API_BASE/api/certificates"

Write-Host "🟡 PHASE 9: ROADMAP & RECOMMENDATIONS" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

Test-API -Name "Get Roadmap" -Method "GET" -Url "$API_BASE/api/roadmap"
Test-API -Name "Get Recommendations" -Method "GET" -Url "$API_BASE/api/recommendation"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Tests: $script:TOTAL"
Write-Host "Passed: $script:PASSED" -ForegroundColor Green
Write-Host "Failed: $script:FAILED" -ForegroundColor Red
Write-Host ""

if ($script:FAILED -eq 0) {
    Write-Host "🎉 ALL TESTS PASSED! System is production-ready." -ForegroundColor Green
    exit 0
}
else {
    Write-Host "❌ SOME TESTS FAILED. Please review and fix." -ForegroundColor Red
    exit 1
}
