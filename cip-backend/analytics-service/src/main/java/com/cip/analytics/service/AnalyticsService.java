package com.cip.analytics.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final RestTemplate restTemplate;

    @Value("${service.score-service:http://score-service:8084}")
    private String scoreServiceUrl;

    @Value("${service.interview-service:http://interview-service:8086}")
    private String interviewServiceUrl;

    public Map<String, Object> getStudentAnalytics(Long userId) {
        Map<String, Object> score = fetchScore(userId);
        List<Map<String, Object>> history = fetchInterviewHistory(userId);

        double readiness = toDouble(score.get("readiness"));
        double averageInterviewScore = history.stream()
                .mapToDouble(item -> toDouble(item.get("totalScore")))
                .filter(value -> value > 0)
                .average()
                .orElse(0);

        List<Map<String, Object>> progressHistory = history.stream()
                .map(item -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("date", String.valueOf(item.getOrDefault("completedAt", item.getOrDefault("startedAt", ""))));
                    m.put("score", toDouble(item.get("totalScore")));
                    return m;
                })
                .toList();

        return new LinkedHashMap<>(Map.ofEntries(
                Map.entry("userId", userId),
                Map.entry("readiness", readiness),
                Map.entry("risk", resolveRisk(readiness)),
                Map.entry("resumeScore", toDouble(score.get("resumeScore"))),
                Map.entry("interviewScore", toDouble(score.get("interviewScore"))),
                Map.entry("averageInterviewScore", averageInterviewScore),
                Map.entry("totalAttempts", history.size()),
                Map.entry("weakSkills", extractWeakSkills(history)),
                Map.entry("progressHistory", progressHistory),
                Map.entry("interviewHistory", progressHistory),
                Map.entry("latestRecommendation", String.valueOf(score.getOrDefault("recommendation", "")))
        ));
    }

    public Map<String, Object> getPlatformAnalytics() {
        List<Map<String, Object>> leaderboard = fetchLeaderboard();
        double averageReadiness = leaderboard.stream()
                .mapToDouble(item -> toDouble(item.get("readiness")))
                .average()
                .orElse(0);

        return Map.of(
                "totalStudents", leaderboard.size(),
                "averageReadiness", averageReadiness,
                "topReadiness", leaderboard.stream().mapToDouble(item -> toDouble(item.get("readiness"))).max().orElse(0)
        );
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchScore(Long userId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-User-Id", String.valueOf(userId));
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    scoreServiceUrl + "/score",
                    HttpMethod.GET,
                    entity,
                    Map.class
            );
            return unwrapMap(response.getBody());
        } catch (Exception e) {
            log.warn("Failed to fetch score for userId={}: {}", userId, e.getMessage());
            return Map.of();
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fetchInterviewHistory(Long userId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-User-Id", String.valueOf(userId));
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    interviewServiceUrl + "/interview/history",
                    HttpMethod.GET,
                    entity,
                    Map.class
            );
            Object payload = response.getBody() != null ? response.getBody().get("data") : null;
            if (payload instanceof List<?> list) {
                List<Map<String, Object>> items = new ArrayList<>();
                for (Object entry : list) {
                    if (entry instanceof Map<?, ?> map) {
                        items.add((Map<String, Object>) map);
                    }
                }
                return items.stream()
                        .filter(item -> "COMPLETED".equals(String.valueOf(item.get("status"))))
                        .toList();
            }
        } catch (Exception e) {
            log.warn("Failed to fetch interview history for userId={}: {}", userId, e.getMessage());
        }
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fetchLeaderboard() {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-User-Role", "ADMIN");
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    scoreServiceUrl + "/score/leaderboard",
                    HttpMethod.GET,
                    entity,
                    Map.class
            );
            Object payload = response.getBody() != null ? response.getBody().get("data") : null;
            if (payload instanceof List<?> list) {
                List<Map<String, Object>> items = new ArrayList<>();
                for (Object entry : list) {
                    if (entry instanceof Map<?, ?> map) {
                        items.add((Map<String, Object>) map);
                    }
                }
                return items;
            }
        } catch (Exception e) {
            log.warn("Failed to fetch leaderboard analytics: {}", e.getMessage());
        }
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> unwrapMap(Map<?, ?> wrapper) {
        if (wrapper == null) {
            return Map.of();
        }
        Object data = wrapper.get("data");
        if (data instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    @SuppressWarnings("unchecked")
    private List<String> extractWeakSkills(List<Map<String, Object>> history) {
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (Map<String, Object> interview : history) {
            Object answersObj = interview.get("answers");
            if (!(answersObj instanceof List<?> answers)) {
                continue;
            }
            for (Object entry : answers) {
                if (!(entry instanceof Map<?, ?> rawMap)) {
                    continue;
                }
                @SuppressWarnings("unchecked")
                Map<String, Object> map = (Map<String, Object>) rawMap;
                double score = toDouble(map.get("score"));
                String topic = String.valueOf(map.getOrDefault("topic", "")).trim();
                if (!topic.isBlank() && score > 0 && score < 70) {
                    counts.put(topic, counts.getOrDefault(topic, 0) + 1);
                }
            }
        }
        return counts.entrySet().stream()
                .filter(entry -> entry.getValue() >= 1)
                .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
                .map(Map.Entry::getKey)
                .limit(5)
                .toList();
    }

    private String resolveRisk(double readiness) {
        if (readiness >= 70) return "LOW";
        if (readiness >= 50) return "MEDIUM";
        return "HIGH";
    }

    private double toDouble(Object value) {
        return value instanceof Number number ? number.doubleValue() : 0;
    }
}
