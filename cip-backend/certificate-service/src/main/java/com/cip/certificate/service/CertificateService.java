package com.cip.certificate.service;

import com.cip.certificate.dto.CertificateDtos.*;
import com.cip.certificate.entity.Certificate;
import com.cip.certificate.entity.Certificate.CertificateStatus;
import com.cip.certificate.entity.CertificateResult;
import com.cip.certificate.kafka.CertificateEventProducer;
import com.cip.certificate.repository.CertificateRepository;
import com.cip.certificate.repository.CertificateResultRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final CertificateResultRepository resultRepository;
    private final StorageService storageService;
    private final CertificateEventProducer eventProducer;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ml.service.url}")
    private String mlServiceUrl;

    private static final Set<String> ALLOWED_TYPES = Set.of(
        "application/pdf", "image/jpeg", "image/png", "image/jpg"
    );
    private static final long MAX_SIZE = 10 * 1024 * 1024L; // 10MB

    // ── Upload ──────────────────────────────────────────────────────────────

    @Transactional
    public UploadResponse uploadCertificate(MultipartFile file, Long userId) throws IOException {
        log.info("[Upload] user={}, file={}, size={}", userId, file.getOriginalFilename(), file.getSize());

        // Validate
        validateFile(file);

        // Compute SHA-256 hash for deduplication
        String fileHash = computeHash(file.getBytes());

        // Check duplicate
        Optional<Certificate> existing = certificateRepository.findByFileHash(fileHash);
        if (existing.isPresent()) {
            Certificate cert = existing.get();
            log.info("[Upload] Duplicate detected for user={}, existing cert_id={}", userId, cert.getId());
            return UploadResponse.builder()
                .certificateId(cert.getId())
                .status(cert.getStatus().name())
                .message("Duplicate file — returning existing result")
                .fileName(cert.getFileName())
                .createdAt(cert.getCreatedAt())
                .build();
        }

        // Store file
        String fileUrl = storageService.store(file, userId);

        // Persist certificate record
        Certificate certificate = Certificate.builder()
            .userId(userId)
            .fileName(file.getOriginalFilename())
            .fileUrl(fileUrl)
            .fileHash(fileHash)
            .fileSize(file.getSize())
            .fileType(file.getContentType())
            .status(CertificateStatus.PENDING)
            .build();

        certificate = certificateRepository.save(certificate);

        // Publish upload event to Kafka
        eventProducer.publishUploaded(certificate.getId(), userId, fileUrl);

        // Trigger async ML processing
        processCertificateAsync(certificate.getId(), fileUrl, userId);

        log.info("[Upload] Certificate created: id={}", certificate.getId());

        return UploadResponse.builder()
            .certificateId(certificate.getId())
            .status(CertificateStatus.PENDING.name())
            .message("Certificate uploaded successfully. Processing started.")
            .fileName(file.getOriginalFilename())
            .createdAt(certificate.getCreatedAt())
            .build();
    }

    // ── Async ML Processing ─────────────────────────────────────────────────

    @Async
    public void processCertificateAsync(Long certId, String fileUrl, Long userId) {
        log.info("[ML] Async processing started: certId={}", certId);

        // Update status to PROCESSING
        certificateRepository.findById(certId).ifPresent(cert -> {
            cert.setStatus(CertificateStatus.PROCESSING);
            certificateRepository.save(cert);
        });

        try {
            // Call ML service
            Map<String, Object> mlResult = callMlService(certId, fileUrl);

            // Save result
            saveResult(certId, mlResult);

            // Update certificate status
            certificateRepository.findById(certId).ifPresent(cert -> {
                cert.setStatus(CertificateStatus.COMPLETED);
                certificateRepository.save(cert);
            });

            // Publish result event
            eventProducer.publishProcessed(certId, userId, mlResult);

            log.info("[ML] Processing complete: certId={}, score={}", certId,
                mlResult.get("authenticity_score"));

        } catch (Exception e) {
            log.error("[ML] Processing failed: certId={}, error={}", certId, e.getMessage());

            certificateRepository.findById(certId).ifPresent(cert -> {
                cert.setStatus(CertificateStatus.FAILED);
                cert.setErrorMessage(e.getMessage());
                certificateRepository.save(cert);
            });

            eventProducer.publishFailed(certId, userId, e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callMlService(Long certId, String fileUrl) {
        log.info("[ML] Calling ML service: certId={}, url={}", certId, mlServiceUrl);

        File file = new File(fileUrl);
        if (!file.exists()) {
            throw new RuntimeException("Certificate file not found: " + fileUrl);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new FileSystemResource(file));

        String url = mlServiceUrl + "/ml/certificate/validate?certificate_id=" + certId + "&user_id=system";

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
            url, HttpMethod.POST, request, Map.class
        );

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            return response.getBody();
        }

        throw new RuntimeException("ML service returned error: " + response.getStatusCode());
    }

    @Transactional
    public void saveResult(Long certId, Map<String, Object> mlResult) {
        @SuppressWarnings("unchecked")
        CertificateResult result = CertificateResult.builder()
            .certificateId(certId)
            .authenticityScore(toInt(mlResult.get("authenticity_score")))
            .status((String) mlResult.get("status"))
            .confidenceLevel((String) mlResult.get("confidence_level"))
            .extractedData((Map<String, Object>) mlResult.get("extracted_data"))
            .issuerValidation((Map<String, Object>) mlResult.get("issuer_validation"))
            .tamperingResult((Map<String, Object>) mlResult.get("tampering_result"))
            .idValidation((Map<String, Object>) mlResult.get("id_validation"))
            .componentScores((Map<String, Object>) mlResult.get("component_scores"))
            .reasons((List<String>) mlResult.get("reasons"))
            .warnings((List<String>) mlResult.get("warnings"))
            .processingTimeMs(toInt(mlResult.get("processing_time_ms")))
            .build();

        resultRepository.save(result);
        log.info("[DB] Result saved: certId={}", certId);
    }

    // ── Query Methods ───────────────────────────────────────────────────────

    public CertificateResponse getCertificate(Long certId) {
        Certificate cert = certificateRepository.findById(certId)
            .orElseThrow(() -> new NoSuchElementException("Certificate not found: " + certId));

        return CertificateResponse.builder()
            .id(cert.getId())
            .userId(cert.getUserId())
            .fileName(cert.getFileName())
            .status(cert.getStatus().name())
            .errorMessage(cert.getErrorMessage())
            .createdAt(cert.getCreatedAt())
            .updatedAt(cert.getUpdatedAt())
            .build();
    }

    public ResultResponse getCertificateResult(Long certId) {
        Certificate cert = certificateRepository.findById(certId)
            .orElseThrow(() -> new NoSuchElementException("Certificate not found: " + certId));

        Optional<CertificateResult> resultOpt = resultRepository.findByCertificateId(certId);

        if (resultOpt.isEmpty()) {
            // Still processing
            return ResultResponse.builder()
                .certificateId(certId)
                .status(cert.getStatus().name())
                .fileName(cert.getFileName())
                .uploadedAt(cert.getCreatedAt())
                .build();
        }

        CertificateResult result = resultOpt.get();

        return ResultResponse.builder()
            .certificateId(certId)
            .authenticityScore(result.getAuthenticityScore())
            .status(result.getStatus())
            .confidenceLevel(result.getConfidenceLevel())
            .extractedData(result.getExtractedData())
            .issuerValidation(result.getIssuerValidation())
            .tamperingResult(result.getTamperingResult())
            .idValidation(result.getIdValidation())
            .componentScores(result.getComponentScores())
            .reasons(result.getReasons())
            .warnings(result.getWarnings())
            .processingTimeMs(result.getProcessingTimeMs())
            .createdAt(result.getCreatedAt())
            .fileName(cert.getFileName())
            .uploadedAt(cert.getCreatedAt())
            .build();
    }

    public UserCertificatesResponse getUserCertificates(Long userId, int page, int size) {
        Page<Certificate> certPage = certificateRepository.findByUserId(
            userId, PageRequest.of(page, size)
        );

        List<CertificateSummary> summaries = certPage.getContent().stream()
            .map(cert -> {
                CertificateSummary.CertificateSummaryBuilder builder = CertificateSummary.builder()
                    .id(cert.getId())
                    .fileName(cert.getFileName())
                    .status(cert.getStatus().name())
                    .createdAt(cert.getCreatedAt());

                // Add score if completed
                if (cert.getStatus() == CertificateStatus.COMPLETED) {
                    resultRepository.findByCertificateId(cert.getId()).ifPresent(result -> {
                        builder.authenticityScore(result.getAuthenticityScore());
                        builder.authenticityStatus(result.getStatus());
                        builder.confidenceLevel(result.getConfidenceLevel());
                    });
                }

                return builder.build();
            })
            .toList();

        return UserCertificatesResponse.builder()
            .certificates(summaries)
            .total((int) certPage.getTotalElements())
            .page(page)
            .size(size)
            .build();
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) throw new IllegalArgumentException("File is empty");
        if (file.getSize() > MAX_SIZE) throw new IllegalArgumentException("File exceeds 10MB limit");
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Unsupported file type: " + file.getContentType());
        }
    }

    private String computeHash(byte[] bytes) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(bytes);
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString();
        }
    }

    private Integer toInt(Object val) {
        if (val == null) return null;
        if (val instanceof Integer i) return i;
        if (val instanceof Number n) return n.intValue();
        try { return Integer.parseInt(val.toString()); } catch (Exception e) { return null; }
    }
}
