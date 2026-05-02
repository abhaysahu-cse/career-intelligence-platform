package com.cip.score.service;

import com.cip.common.events.CipEvent;
import com.cip.common.events.KafkaTopics;
import com.cip.common.exception.CipException;
import com.cip.score.dto.ScoreDtos;
import com.cip.score.entity.Score;
import com.cip.score.repository.ScoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * CORE ENGINE — Career Readiness Score Computation
 *
 * Formula: Readiness = 0.4 * ResumeScore + 0.6 * InterviewScore
 *
 * Levels:
 *   0-30   → "Beginner"
 *   31-50  → "Developing"
 *   51-70  → "Almost Ready"
 *   71-85  → "Job Ready"
 *   86-100 → "Highly Competitive"
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScoreEngine {

    private static final double RESUME_WEIGHT   = 0.40;
    private static final double INTERVIEW_WEIGHT = 0.60;

    private final ScoreRepository scoreRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Cacheable(value = "score", key = "#userId")
    public ScoreDtos.ScoreResponse getScore(Long userId) {
        Score score = scoreRepository.findById(userId)
                .orElse(Score.builder().userId(userId).build());
        return toResponse(score);
    }

    @Transactional
    @CacheEvict(value = "score", key = "#request.userId")
    public ScoreDtos.ScoreResponse updateScore(ScoreDtos.UpdateScoreRequest request) {
        Score score = scoreRepository.findById(request.getUserId())
                .orElse(Score.builder().userId(request.getUserId()).build());

        if (request.getResumeScore() != null)   score.setResumeScore(clamp(request.getResumeScore()));
        if (request.getInterviewScore() != null) score.setInterviewScore(clamp(request.getInterviewScore()));

        double readiness = compute(score.getResumeScore(), score.getInterviewScore());
        score.setReadiness(readiness);
        score.setLevel(resolveLevel(readiness));
        score.setRecommendation(generateRecommendation(score));

        score = scoreRepository.save(score);

        // Publish to score-events in format matching ML and WebSocket expectations
        Map<String, Object> scoreEvent = Map.of(
            "event_type", "SCORE_UPDATED",
            "user_id", score.getUserId().toString(),
            "student_id", score.getUserId().toString(),  // For ML compatibility
            "payload", Map.of(
                "readiness_score", readiness,
                "level", score.getLevel(),
                "domain_scores", Map.of(
                    "resume", score.getResumeScore(),
                    "academic", score.getAcademicScore(),
                    "interview", score.getInterviewScore()
                ),
                "trend", "up"  // TODO: Calculate actual trend
            ),
            "timestamp", System.currentTimeMillis() / 1000.0
        );
        
        kafkaTemplate.send(KafkaTopics.SCORE_EVENTS, score.getUserId().toString(), scoreEvent);
        log.info("Score updated for userId={}: readiness={}, level={}", score.getUserId(), readiness, score.getLevel());

        return toResponse(score);
    }

    /** Recalculate triggered by Kafka events (resume parsed, interview completed, etc.) */
    @Transactional
    public void recalculateFromEvent(Long userId, String scoreType, Double value) {
        ScoreDtos.UpdateScoreRequest req = new ScoreDtos.UpdateScoreRequest();
        req.setUserId(userId);
        switch (scoreType) {
            case "resume"    -> req.setResumeScore(value);
            case "academic"  -> req.setAcademicScore(value);
            case "interview" -> req.setInterviewScore(value);
        }
        updateScore(req);
    }

    public List<Score> getLeaderboard() {
        return scoreRepository.findTopScores();
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private double compute(double resume, double interview) {
        return clamp(RESUME_WEIGHT * resume + INTERVIEW_WEIGHT * interview);
    }

    private String resolveLevel(double readiness) {
        if (readiness >= 86) return "Highly Competitive";
        if (readiness >= 71) return "Job Ready";
        if (readiness >= 51) return "Almost Ready";
        if (readiness >= 31) return "Developing";
        return "Beginner";
    }

    private String generateRecommendation(Score score) {
        StringBuilder sb = new StringBuilder();
        if (score.getInterviewScore() < 60)
            sb.append("Improve DSA and communication skills. ");
        if (score.getResumeScore() < 60)
            sb.append("Enhance your resume with quantifiable achievements. ");
        if (score.getAcademicScore() < 60)
            sb.append("Focus on core subjects and improve CGPA. ");
        if (sb.isEmpty())
            sb.append("Excellent profile! Apply for top-tier roles and explore leadership opportunities.");
        return sb.toString().trim();
    }

    private double clamp(double val) {
        return Math.max(0, Math.min(100, val));
    }

    private ScoreDtos.ScoreResponse toResponse(Score s) {
        return ScoreDtos.ScoreResponse.builder()
                .userId(s.getUserId())
                .readiness(s.getReadiness())
                .level(s.getLevel())
                .resumeScore(s.getResumeScore())
                .academicScore(s.getAcademicScore())
                .interviewScore(s.getInterviewScore())
                .recommendation(s.getRecommendation())
                .calculatedAt(s.getCalculatedAt())
                .build();
    }
}
