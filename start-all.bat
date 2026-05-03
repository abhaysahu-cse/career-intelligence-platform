@echo off
cd "C:\Projects\job  interview_job search_ performance analyzer\cip-backend"
set DB_PASSWORD=cip123
start /b cmd /c "java -jar certificate-service/target/certificate-service-1.0.0.jar > certificate-service.log 2>&1"
start /b cmd /c "java -jar auth-service/target/auth-service-1.0.0.jar > auth-service.log 2>&1"
start /b cmd /c "java -jar student-service/target/student-service-1.0.0.jar > student-service.log 2>&1"
start /b cmd /c "java -jar resume-service/target/resume-service-1.0.0.jar > resume-service.log 2>&1"
start /b cmd /c "java -jar score-service/target/score-service-1.0.0.jar > score-service.log 2>&1"
start /b cmd /c "java -jar interview-service/target/interview-service-1.0.0.jar > interview-service.log 2>&1"
start /b cmd /c "java -jar job-service/target/job-service-1.0.0.jar > job-service.log 2>&1"
start /b cmd /c "java -jar recommendation-service/target/recommendation-service-1.0.0.jar > recommendation-service.log 2>&1"
start /b cmd /c "java -jar analytics-service/target/analytics-service-1.0.0.jar > analytics-service.log 2>&1"
