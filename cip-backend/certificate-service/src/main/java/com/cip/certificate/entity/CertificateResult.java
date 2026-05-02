package com.cip.certificate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "certificate_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CertificateResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "certificate_id", nullable = false, unique = true)
    private Long certificateId;

    @Column(name = "authenticity_score")
    private Integer authenticityScore;

    @Column(name = "status")
    private String status;

    @Column(name = "confidence_level")
    private String confidenceLevel;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "extracted_data", columnDefinition = "jsonb")
    private Map<String, Object> extractedData;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "issuer_validation", columnDefinition = "jsonb")
    private Map<String, Object> issuerValidation;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tampering_result", columnDefinition = "jsonb")
    private Map<String, Object> tamperingResult;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "id_validation", columnDefinition = "jsonb")
    private Map<String, Object> idValidation;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "component_scores", columnDefinition = "jsonb")
    private Map<String, Object> componentScores;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "reasons", columnDefinition = "jsonb")
    private List<String> reasons;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "warnings", columnDefinition = "jsonb")
    private List<String> warnings;

    @Column(name = "processing_time_ms")
    private Integer processingTimeMs;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
