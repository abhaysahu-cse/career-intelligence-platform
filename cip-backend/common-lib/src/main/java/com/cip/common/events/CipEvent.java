package com.cip.common.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CipEvent {
    private String eventType;
    private Long userId;
    private Map<String, Object> payload;

    @Builder.Default
    private LocalDateTime occurredAt = LocalDateTime.now();

    // Factory methods for each event type
    public static CipEvent resumeUploaded(Long userId, String resumeId, String fileUrl) {
        return CipEvent.builder()
                .eventType(KafkaTopics.RESUME_UPLOADED)
                .userId(userId)
                .payload(Map.of("resumeId", resumeId, "fileUrl", fileUrl))
                .build();
    }

    public static CipEvent interviewCompleted(Long userId, Long interviewId, Double score) {
        return CipEvent.builder()
                .eventType(KafkaTopics.INTERVIEW_COMPLETED)
                .userId(userId)
                .payload(Map.of("interviewId", interviewId, "score", score))
                .build();
    }

    public static CipEvent scoreUpdated(Long userId, Double readiness, String level) {
        return CipEvent.builder()
                .eventType(KafkaTopics.SCORE_UPDATED)
                .userId(userId)
                .payload(Map.of("readiness", readiness, "level", level))
                .build();
    }

    public static CipEvent studentUpdated(Long userId) {
        return CipEvent.builder()
                .eventType(KafkaTopics.STUDENT_UPDATED)
                .userId(userId)
                .payload(Map.of("userId", userId))
                .build();
    }
}
