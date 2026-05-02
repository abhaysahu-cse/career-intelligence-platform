package com.cip.score.dto;

import lombok.*;
import java.time.LocalDateTime;

public class ScoreDtos {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ScoreResponse {
        private Long userId;
        private Double readiness;
        private String level;
        private Double resumeScore;
        private Double academicScore;
        private Double interviewScore;
        private String recommendation;
        private LocalDateTime calculatedAt;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class UpdateScoreRequest {
        private Long userId;
        private Double resumeScore;
        private Double academicScore;
        private Double interviewScore;
    }
}
