# Start Services on Windows

Use separate PowerShell windows for the backend jars after building with Maven.

## Build first

```powershell
Set-Location "C:\Projects\job  interview_job search_ performance analyzer\cip-backend"
mvn -DskipTests package
```

## Start backend services

### Window 1: API Gateway
```powershell
cd "C:\Projects\job  interview_job search_ performance analyzer\cip-backend"
java -jar api-gateway/target/api-gateway-1.0.0.jar
```

### Window 2: Certificate Service
```powershell
cd "C:\Projects\job  interview_job search_ performance analyzer\cip-backend"
$env:DB_PASSWORD="cip123"
java -jar certificate-service/target/certificate-service-1.0.0.jar
```

### Window 3: Auth Service
```powershell
cd "C:\Projects\job  interview_job search_ performance analyzer\cip-backend"
java -jar auth-service/target/auth-service-1.0.0.jar
```

### Window 4: Student Service
```powershell
cd "C:\Projects\job  interview_job search_ performance analyzer\cip-backend"
java -jar student-service/target/student-service-1.0.0.jar
```

### Window 5: Resume Service
```powershell
cd "C:\Projects\job  interview_job search_ performance analyzer\cip-backend"
java -jar resume-service/target/resume-service-1.0.0.jar
```

### Window 6: Score Service
```powershell
cd "C:\Projects\job  interview_job search_ performance analyzer\cip-backend"
java -jar score-service/target/score-service-1.0.0.jar
```

### Window 7: Interview Service
```powershell
cd "C:\Projects\job  interview_job search_ performance analyzer\cip-backend"
java -jar interview-service/target/interview-service-1.0.0.jar
```

### Window 8: Job Service
```powershell
cd "C:\Projects\job  interview_job search_ performance analyzer\cip-backend"
java -jar job-service/target/job-service-1.0.0.jar
```

### Window 9: Recommendation Service
```powershell
cd "C:\Projects\job  interview_job search_ performance analyzer\cip-backend"
java -jar recommendation-service/target/recommendation-service-1.0.0.jar
```

## Start ML service

```powershell
Set-Location "C:\Projects\job  interview_job search_ performance analyzer\cip-ml"
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Start frontend

```powershell
Set-Location "C:\Projects\job  interview_job search_ performance analyzer\cip-web"
npm install
npm run dev
```

## Check status

```powershell
curl http://localhost:8000/health
curl http://localhost:8080/actuator/health
curl http://localhost:8089/certificates/health
curl http://localhost:3000
```

## Access URLs

- Frontend: http://localhost:3000
- ML API: http://localhost:8000/docs
- Certificates: http://localhost:3000/certificates
- Kafka UI: http://localhost:8090
