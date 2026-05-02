package com.cip.certificate.dto;

import com.cip.certificate.entity.Certificate;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class CertificateDtos {

    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UploadResponse {
        private Long certificateId;
        private String status;
        private String message;
        private String fileName;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CertificateResponse {
        private Long id;
        private Long userId;
        private String fileName;
        private String fileUrl;
        private String status;
        private String errorMessage;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ResultResponse {
        private Long certificateId;
        private Integer authenticityScore;
        private String status;
        private String confidenceLevel;
        private Map<String, Object> extractedData;
        private Map<String, Object> issuerValidation;
        private Map<String, Object> tamperingResult;
        private Map<String, Object> idValidation;
        private Map<String, Object> componentScores;
        private List<String> reasons;
        private List<String> warnings;
        private Integer processingTimeMs;
        private LocalDateTime createdAt;
        // Certificate info
        private String fileName;
        private LocalDateTime uploadedAt;
    }

    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserCertificatesResponse {
        private List<CertificateSummary> certificates;
        private int total;
        private int page;
        private int size;
    }

    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CertificateSummary {
        private Long id;
        private String fileName;
        private String status;
        private Integer authenticityScore;
        private String authenticityStatus;
        private String confidenceLevel;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    public static class ApiError {
        private int statusCode;
        private String error;
        private String message;
        private LocalDateTime timestamp;
    }
}
