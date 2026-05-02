package com.cip.interview.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "interviews")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Interview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private InterviewType type = InterviewType.TECHNICAL;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private InterviewStatus status = InterviewStatus.IN_PROGRESS;

    private String jobRole; // context: "Backend Engineer", "Data Scientist", etc.

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Object questions; // List of question objects

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Object answers; // List of answer objects with scores

    private Double totalScore;   // 0-100
    private Integer totalQuestions;
    private Integer answeredQuestions;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Object feedback; // Detailed ML feedback per question

    @CreationTimestamp
    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum InterviewType {
        TECHNICAL, BEHAVIORAL, HR, DSA
    }

    public enum InterviewStatus {
        IN_PROGRESS, COMPLETED, ABANDONED
    }
}
