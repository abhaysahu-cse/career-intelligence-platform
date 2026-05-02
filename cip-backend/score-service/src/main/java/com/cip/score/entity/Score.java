package com.cip.score.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "scores")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Score {

    @Id
    private Long userId;

    @Column(nullable = false)
    @Builder.Default
    private Double resumeScore = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double academicScore = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double interviewScore = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double readiness = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private String level = "Not Started";

    private String recommendation;

    @UpdateTimestamp
    private LocalDateTime calculatedAt;
}
