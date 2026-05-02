package com.cip.recommendation.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final StringRedisTemplate redisTemplate;

    // ── Roadmap ───────────────────────────────────────────────────────────────

    @Cacheable(value = "roadmap", key = "#role + '-' + #readinessLevel")
    public Map<String, Object> getRoadmap(String role, String readinessLevel, List<String> currentSkills) {
        String targetRole = role != null ? role.toLowerCase() : "backend-engineer";

        Map<String, Object> roadmap = new LinkedHashMap<>();
        roadmap.put("targetRole", targetRole);
        roadmap.put("estimatedDuration", getEstimatedDuration(readinessLevel));
        roadmap.put("phases", buildPhases(targetRole, readinessLevel, currentSkills));
        roadmap.put("resources", getResources(targetRole));
        roadmap.put("milestones", getMilestones(readinessLevel));

        log.info("Generated roadmap for role={}, level={}", targetRole, readinessLevel);
        return roadmap;
    }

    // ── Skill Recommendations ─────────────────────────────────────────────────

    public Map<String, Object> getSkillRecommendations(Long userId, double readiness,
                                                         List<String> currentSkills,
                                                         String targetRole) {
        List<String> coreSkills = getCoreSkillsForRole(targetRole);
        List<String> missing = coreSkills.stream()
                .filter(s -> currentSkills == null || currentSkills.stream()
                        .noneMatch(cs -> cs.equalsIgnoreCase(s)))
                .toList();

        List<Map<String, Object>> recommendations = missing.stream().map(skill -> {
            Map<String, Object> rec = new LinkedHashMap<>();
            rec.put("skill", skill);
            rec.put("priority", getPriority(skill, readiness));
            rec.put("estimatedLearningTime", getLearningTime(skill));
            rec.put("resources", getSkillResources(skill));
            rec.put("marketDemand", "HIGH");
            return rec;
        }).toList();

        return Map.of(
                "userId", userId,
                "targetRole", targetRole != null ? targetRole : "General",
                "currentSkillsCount", currentSkills != null ? currentSkills.size() : 0,
                "recommendedSkills", recommendations,
                "priorityOrder", recommendations.stream()
                        .filter(r -> "HIGH".equals(r.get("priority")))
                        .map(r -> r.get("skill"))
                        .toList()
        );
    }

    // ── Learning Resources ────────────────────────────────────────────────────

    public List<Map<String, Object>> getLearningResources(String skill, String type) {
        return getSkillResources(skill != null ? skill : "Java");
    }

    // ── Kafka event-driven recommendation refresh ──────────────────────────────

    public void refreshRecommendationsForUser(Long userId) {
        String pattern = "roadmap:*";
        redisTemplate.delete("recommendations:" + userId);
        log.info("Cleared recommendation cache for userId={}", userId);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private List<Map<String, Object>> buildPhases(String role, String level, List<String> skills) {
        return switch (role) {
            case "backend-engineer" -> List.of(
                Map.of("phase", 1, "title", "Core Java & OOP",
                        "duration", "3-4 weeks",
                        "topics", List.of("Java 17 features", "OOP principles", "Collections", "Generics"),
                        "completed", hasSkill(skills, "Java")),
                Map.of("phase", 2, "title", "Spring Boot & REST APIs",
                        "duration", "4-5 weeks",
                        "topics", List.of("Spring Boot", "REST API design", "JPA/Hibernate", "Spring Security"),
                        "completed", hasSkill(skills, "Spring Boot")),
                Map.of("phase", 3, "title", "Database & Caching",
                        "duration", "2-3 weeks",
                        "topics", List.of("PostgreSQL", "Redis", "Database design", "Query optimization"),
                        "completed", hasSkill(skills, "SQL")),
                Map.of("phase", 4, "title", "Microservices & Kafka",
                        "duration", "3-4 weeks",
                        "topics", List.of("Microservices architecture", "Docker", "Kafka", "API Gateway"),
                        "completed", hasSkill(skills, "Kafka")),
                Map.of("phase", 5, "title", "DSA & System Design",
                        "duration", "4-6 weeks",
                        "topics", List.of("Arrays & Strings", "Trees & Graphs", "DP", "System Design patterns"),
                        "completed", false),
                Map.of("phase", 6, "title", "Interview Preparation",
                        "duration", "2-3 weeks",
                        "topics", List.of("AI interview practice", "Behavioral rounds", "Resume optimization"),
                        "completed", false)
            );
            case "data-scientist" -> List.of(
                Map.of("phase", 1, "title", "Python & Statistics",
                        "duration", "3-4 weeks",
                        "topics", List.of("Python", "NumPy", "Pandas", "Statistics basics"),
                        "completed", hasSkill(skills, "Python")),
                Map.of("phase", 2, "title", "Machine Learning",
                        "duration", "6-8 weeks",
                        "topics", List.of("Supervised learning", "Unsupervised learning", "scikit-learn", "Model evaluation"),
                        "completed", hasSkill(skills, "Machine Learning")),
                Map.of("phase", 3, "title", "Deep Learning",
                        "duration", "4-5 weeks",
                        "topics", List.of("Neural networks", "TensorFlow/PyTorch", "CNNs", "NLP basics"),
                        "completed", false),
                Map.of("phase", 4, "title", "MLOps & Deployment",
                        "duration", "3 weeks",
                        "topics", List.of("Model deployment", "MLflow", "Docker", "REST APIs for ML"),
                        "completed", false)
            );
            case "frontend-engineer" -> List.of(
                Map.of("phase", 1, "title", "HTML, CSS & JavaScript",
                        "duration", "3-4 weeks",
                        "topics", List.of("HTML5", "CSS3", "ES6+", "DOM manipulation"),
                        "completed", hasSkill(skills, "JavaScript")),
                Map.of("phase", 2, "title", "React.js",
                        "duration", "4-5 weeks",
                        "topics", List.of("React hooks", "State management", "Router", "Context API"),
                        "completed", hasSkill(skills, "React")),
                Map.of("phase", 3, "title", "Advanced Frontend",
                        "duration", "3-4 weeks",
                        "topics", List.of("TypeScript", "Testing", "Performance", "Next.js"),
                        "completed", false)
            );
            default -> List.of(
                Map.of("phase", 1, "title", "Fundamentals",
                        "duration", "4 weeks",
                        "topics", List.of("Programming basics", "DSA", "Git"),
                        "completed", false),
                Map.of("phase", 2, "title", "Core Skills",
                        "duration", "6 weeks",
                        "topics", List.of("Databases", "APIs", "Cloud basics"),
                        "completed", false)
            );
        };
    }

    private List<String> getCoreSkillsForRole(String role) {
        if (role == null) return List.of("Java", "SQL", "Git", "DSA");
        return switch (role.toLowerCase()) {
            case "backend-engineer" -> List.of("Java", "Spring Boot", "SQL", "Redis", "Kafka", "Docker", "DSA");
            case "data-scientist"   -> List.of("Python", "Machine Learning", "SQL", "TensorFlow", "Statistics");
            case "frontend-engineer"-> List.of("React", "JavaScript", "TypeScript", "HTML", "CSS", "REST APIs");
            case "devops-engineer"  -> List.of("Docker", "Kubernetes", "CI/CD", "Linux", "Terraform", "AWS");
            case "full-stack"       -> List.of("Java", "Spring Boot", "React", "SQL", "Docker", "Git");
            default                 -> List.of("Java", "SQL", "DSA", "Git", "Communication");
        };
    }

    private String getEstimatedDuration(String level) {
        if (level == null) return "3-6 months";
        return switch (level) {
            case "Beginner"            -> "5-7 months";
            case "Developing"          -> "3-5 months";
            case "Almost Ready"        -> "2-3 months";
            case "Job Ready"           -> "1-2 months";
            case "Highly Competitive"  -> "2-4 weeks";
            default                    -> "3-6 months";
        };
    }

    private List<Map<String, Object>> getResources(String role) {
        return List.of(
            Map.of("type", "COURSE", "title", "Spring Boot Microservices", "platform", "Udemy",
                    "url", "https://udemy.com", "free", false),
            Map.of("type", "BOOK", "title", "Clean Code", "author", "Robert C. Martin", "free", false),
            Map.of("type", "PRACTICE", "title", "LeetCode DSA Problems", "url", "https://leetcode.com", "free", true),
            Map.of("type", "COURSE", "title", "CS50x Introduction to Computer Science",
                    "platform", "edX", "url", "https://cs50.harvard.edu", "free", true)
        );
    }

    private List<Map<String, Object>> getMilestones(String level) {
        return List.of(
            Map.of("milestone", "Complete your first Spring Boot project", "points", 100),
            Map.of("milestone", "Solve 50 LeetCode problems", "points", 150),
            Map.of("milestone", "Upload and optimize your resume", "points", 50),
            Map.of("milestone", "Complete 3 AI interview sessions", "points", 200),
            Map.of("milestone", "Reach 70% Readiness Score", "points", 300)
        );
    }

    private String getPriority(String skill, double readiness) {
        List<String> highPriority = List.of("Java", "Python", "DSA", "SQL", "React");
        return highPriority.stream().anyMatch(s -> s.equalsIgnoreCase(skill)) ? "HIGH" : "MEDIUM";
    }

    private String getLearningTime(String skill) {
        Map<String, String> times = Map.of(
                "Java", "4-6 weeks", "Python", "3-4 weeks",
                "React", "4-5 weeks", "Docker", "1-2 weeks",
                "Kafka", "1-2 weeks", "Kubernetes", "2-3 weeks",
                "DSA", "8-12 weeks", "SQL", "2-3 weeks"
        );
        return times.getOrDefault(skill, "2-4 weeks");
    }

    private List<Map<String, Object>> getSkillResources(String skill) {
        return List.of(
            Map.of("type", "VIDEO", "title", skill + " Full Course",
                    "platform", "YouTube", "free", true, "url", "https://youtube.com"),
            Map.of("type", "PRACTICE", "title", skill + " Practice Problems",
                    "platform", "HackerRank", "free", true, "url", "https://hackerrank.com"),
            Map.of("type", "DOCS", "title", "Official " + skill + " Documentation",
                    "platform", "Official", "free", true, "url", "https://docs.oracle.com")
        );
    }

    private boolean hasSkill(List<String> skills, String skill) {
        return skills != null && skills.stream().anyMatch(s -> s.equalsIgnoreCase(skill));
    }
}
