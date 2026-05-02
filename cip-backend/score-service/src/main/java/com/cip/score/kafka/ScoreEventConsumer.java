package com.cip.score.kafka;

import com.cip.common.events.KafkaTopics;
import com.cip.score.service.ScoreEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScoreEventConsumer {

    private final ScoreEngine scoreEngine;

    /**
     * Listens to score-events topic where ML service publishes all score updates.
     * Handles multiple event types: resume_scored, interview_scored, academic_predicted, readiness_computed
     */
    @KafkaListener(topics = KafkaTopics.SCORE_EVENTS, groupId = "score-service")
    public void onScoreEvent(Map<String, Object> event) {
        try {
            String eventType = (String) event.get("event_type");
            String studentIdStr = (String) event.get("student_id");
            Long userId = Long.parseLong(studentIdStr);
            
            log.info("Received score event: type={}, userId={}", eventType, userId);
            
            switch (eventType) {
                case "resume_scored":
                case "resume_analyzed":
                    handleResumeScore(userId, event);
                    break;
                    
                case "interview_scored":
                case "interview_evaluated":
                    handleInterviewScore(userId, event);
                    break;
                    
                case "academic_predicted":
                    handleAcademicScore(userId, event);
                    break;
                    
                case "readiness_computed":
                    handleReadinessScore(userId, event);
                    break;
                    
                default:
                    log.warn("Unknown score event type: {}", eventType);
            }
            
        } catch (Exception e) {
            log.error("Error processing score event: {}", e.getMessage(), e);
        }
    }
    
    private void handleResumeScore(Long userId, Map<String, Object> event) {
        try {
            Object scoreObj = event.get("resume_score");
            if (scoreObj != null) {
                Double score = ((Number) scoreObj).doubleValue();
                scoreEngine.recalculateFromEvent(userId, "resume", score);
                log.info("✅ Resume score updated: userId={}, score={}", userId, score);
            }
        } catch (Exception e) {
            log.error("Error handling resume score: {}", e.getMessage());
        }
    }
    
    private void handleInterviewScore(Long userId, Map<String, Object> event) {
        try {
            Object scoreObj = event.get("overall_score");
            if (scoreObj == null) {
                scoreObj = event.get("interview_score");
            }
            if (scoreObj != null) {
                Double score = ((Number) scoreObj).doubleValue();
                scoreEngine.recalculateFromEvent(userId, "interview", score);
                log.info("✅ Interview score updated: userId={}, score={}", userId, score);
            }
        } catch (Exception e) {
            log.error("Error handling interview score: {}", e.getMessage());
        }
    }
    
    private void handleAcademicScore(Long userId, Map<String, Object> event) {
        try {
            Object cgpaObj = event.get("predicted_cgpa");
            if (cgpaObj != null) {
                Double cgpa = ((Number) cgpaObj).doubleValue();
                // Convert CGPA (0-10) to score (0-100)
                Double score = cgpa * 10.0;
                scoreEngine.recalculateFromEvent(userId, "academic", score);
                log.info("✅ Academic score updated: userId={}, cgpa={}, score={}", userId, cgpa, score);
            }
        } catch (Exception e) {
            log.error("Error handling academic score: {}", e.getMessage());
        }
    }
    
    private void handleReadinessScore(Long userId, Map<String, Object> event) {
        try {
            Object scoreObj = event.get("readiness_score");
            if (scoreObj != null) {
                Double score = ((Number) scoreObj).doubleValue();
                scoreEngine.recalculateFromEvent(userId, "readiness", score);
                log.info("✅ Readiness score updated: userId={}, score={}", userId, score);
            }
        } catch (Exception e) {
            log.error("Error handling readiness score: {}", e.getMessage());
        }
    }
}
