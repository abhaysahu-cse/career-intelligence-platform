package com.cip.interview.dto;

import com.cip.interview.entity.Interview;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

public class InterviewDtos {

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class StartRequest {
        private Interview.InterviewType type;
        private String jobRole;
        private Integer numberOfQuestions;
        private Object questions;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class AnswerRequest {
        private Long interviewId;
        private Integer questionIndex;
        private String question;
        private String answer;
        private Long timeTakenSeconds;
        private Double score;
        private String topic;
        private String difficulty;
        private Object feedback;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class InterviewResponse {
        private Long id;
        private Long userId;
        private Interview.InterviewType type;
        private Interview.InterviewStatus status;
        private String jobRole;
        private Object questions;
        private Object answers;
        private Double totalScore;
        private Integer totalQuestions;
        private Integer answeredQuestions;
        private Object feedback;
        private LocalDateTime startedAt;
        private LocalDateTime completedAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ResultSummary {
        private Long interviewId;
        private Double score;
        private String level;
        private Object feedback;
        private List<String> strengthAreas;
        private List<String> improvementAreas;
    }
}
