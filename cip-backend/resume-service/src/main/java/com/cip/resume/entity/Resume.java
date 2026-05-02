package com.cip.resume.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "resumes")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String fileUrl;

    private Long fileSizeBytes;
    private String contentType;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ParseStatus parseStatus = ParseStatus.PENDING;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Object parsedData; // ML-parsed: {skills, experience, education, score}

    private Double resumeScore; // 0-100 score from ML

    @CreationTimestamp
    private LocalDateTime uploadedAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum ParseStatus {
        PENDING, PROCESSING, COMPLETED, FAILED
    }
}
