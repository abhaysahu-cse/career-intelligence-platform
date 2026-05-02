FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Copy common-lib jar (pre-built)
RUN mkdir -p /root/.m2
COPY .m2 /root/.m2 2>/dev/null || true
RUN apk add --no-cache maven && mvn package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=docker", "app.jar"]
