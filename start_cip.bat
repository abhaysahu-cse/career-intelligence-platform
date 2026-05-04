@echo off
echo ===================================================
echo    Career Intelligence Platform - Full Startup
echo ===================================================
echo.

REM === Set environment variables for Java services ===
REM Docker postgres is mapped to host port 5433
set DB_HOST=localhost
set DB_PORT=5433
set DB_PASSWORD=cip123
set REDIS_HOST=localhost
set REDIS_PORT=6379
set REDIS_PASSWORD=cip-redis-pass

echo [1/4] Starting Docker Infrastructure...
cd cip-infra
start "CIP Docker Infra" cmd /k "docker-compose up -d && echo Infrastructure started!"
cd ..
timeout /t 10 /nobreak >nul

echo [2/4] Starting ML Engine (Python FastAPI)...
cd cip-ml
start "CIP ML Engine" cmd /k "uvicorn main:app --port 8000 --reload"
cd ..
timeout /t 5 /nobreak >nul

echo [3/4] Starting Backend Microservices (Java)...
cd cip-backend
start "API Gateway"             cmd /k "set DB_PORT=5433&& set REDIS_PASSWORD=cip-redis-pass&& java -jar api-gateway/target/api-gateway-1.0.0.jar"
timeout /t 3 /nobreak >nul
start "Auth Service"            cmd /k "set DB_PORT=5433&& set REDIS_PASSWORD=cip-redis-pass&& java -jar auth-service/target/auth-service-1.0.0.jar"
start "Student Service"         cmd /k "set DB_PORT=5433&& set REDIS_PASSWORD=cip-redis-pass&& java -jar student-service/target/student-service-1.0.0.jar"
start "Resume Service"          cmd /k "set DB_PORT=5433&& set REDIS_PASSWORD=cip-redis-pass&& java -jar resume-service/target/resume-service-1.0.0.jar"
start "Score Service"           cmd /k "set DB_PORT=5433&& set REDIS_PASSWORD=cip-redis-pass&& java -jar score-service/target/score-service-1.0.0.jar"
start "Interview Service"       cmd /k "set DB_PORT=5433&& set REDIS_PASSWORD=cip-redis-pass&& java -jar interview-service/target/interview-service-1.0.0.jar"
start "Job Service"             cmd /k "set DB_PORT=5433&& set REDIS_PASSWORD=cip-redis-pass&& java -jar job-service/target/job-service-1.0.0.jar"
start "Recommendation Service"  cmd /k "set DB_PORT=5433&& set REDIS_PASSWORD=cip-redis-pass&& java -jar recommendation-service/target/recommendation-service-1.0.0.jar"
start "Analytics Service"       cmd /k "set DB_PORT=5433&& set REDIS_PASSWORD=cip-redis-pass&& java -jar analytics-service/target/analytics-service-1.0.0.jar"
start "Certificate Service"     cmd /k "set DB_PORT=5433&& set REDIS_PASSWORD=cip-redis-pass&& java -jar certificate-service/target/certificate-service-1.0.0.jar"
cd ..

echo [4/4] Starting Frontend (Next.js)...
cd cip-web
start "CIP Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ===================================================
echo    ALL SERVICES LAUNCHED!
echo.
echo    Frontend:      http://localhost:3000
echo    API Gateway:   http://localhost:8080
echo    ML Engine:     http://localhost:8000
echo    PostgreSQL:    localhost:5433
echo    Redis:         localhost:6379
echo    Kafka UI:      http://localhost:8090
echo.
echo    Wait ~60 seconds for Java services to fully boot.
echo ===================================================
pause
