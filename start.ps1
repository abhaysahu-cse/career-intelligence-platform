$services = @("api-gateway", "certificate-service", "auth-service", "student-service", "resume-service", "score-service", "interview-service", "job-service", "recommendation-service", "analytics-service")
cd "C:\Projects\job  interview_job search_ performance analyzer\cip-backend"
foreach ($service in $services) {
    $cmd = "cd 'C:\Projects\job  interview_job search_ performance analyzer\cip-backend'; `$env:DB_PASSWORD='cip123'; `$env:DB_PORT='5433'; java -jar ${service}/target/${service}-1.0.0.jar > ${service}.log 2>&1"
    Start-Process powershell -WindowStyle Hidden -ArgumentList "-Command", $cmd
}
