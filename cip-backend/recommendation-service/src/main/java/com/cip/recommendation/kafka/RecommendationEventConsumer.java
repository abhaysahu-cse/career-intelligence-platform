package com.cip.recommendation.kafka;

import com.cip.common.events.CipEvent;
import com.cip.common.events.KafkaTopics;
import com.cip.recommendation.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class RecommendationEventConsumer {

    private final RecommendationService recommendationService;

    @KafkaListener(topics = KafkaTopics.SCORE_UPDATED, groupId = "recommendation-service")
    public void onScoreUpdated(CipEvent event) {
        try {
            recommendationService.refreshRecommendationsForUser(event.getUserId());
            log.info("Refreshed recommendations for userId={} after score update", event.getUserId());
        } catch (Exception e) {
            log.error("Error refreshing recommendations: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = KafkaTopics.STUDENT_UPDATED, groupId = "recommendation-service")
    public void onStudentUpdated(CipEvent event) {
        try {
            recommendationService.refreshRecommendationsForUser(event.getUserId());
            log.info("Refreshed recommendations for userId={} after student update", event.getUserId());
        } catch (Exception e) {
            log.error("Error refreshing recommendations: {}", e.getMessage());
        }
    }
}
