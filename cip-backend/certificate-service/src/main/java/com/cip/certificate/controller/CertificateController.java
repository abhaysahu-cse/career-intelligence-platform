package com.cip.certificate.controller;

import com.cip.certificate.dto.CertificateDtos.*;
import com.cip.certificate.service.CertificateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/certificates")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class CertificateController {

    private final CertificateService certificateService;

    /**
     * POST /certificates/upload
     * Upload a certificate file for validation
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadResponse> upload(
        @RequestParam("file") MultipartFile file,
        @RequestParam("userId") Long userId
    ) {
        log.info("[API] POST /certificates/upload — user={}, file={}", userId, file.getOriginalFilename());
        try {
            UploadResponse response = certificateService.uploadCertificate(file, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            log.warn("[API] Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("[API] Upload failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * GET /certificates/{id}
     * Get certificate metadata and processing status
     */
    @GetMapping("/{id}")
    public ResponseEntity<CertificateResponse> getCertificate(@PathVariable Long id) {
        log.info("[API] GET /certificates/{}", id);
        try {
            return ResponseEntity.ok(certificateService.getCertificate(id));
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET /certificates/{id}/result
     * Get full validation result with authenticity score
     */
    @GetMapping("/{id}/result")
    public ResponseEntity<ResultResponse> getResult(@PathVariable Long id) {
        log.info("[API] GET /certificates/{}/result", id);
        try {
            return ResponseEntity.ok(certificateService.getCertificateResult(id));
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET /certificates/user/{userId}
     * Get all certificates for a user (paginated)
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<UserCertificatesResponse> getUserCertificates(
        @PathVariable Long userId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        log.info("[API] GET /certificates/user/{} page={}", userId, page);
        return ResponseEntity.ok(certificateService.getUserCertificates(userId, page, size));
    }

    /**
     * GET /certificates/health
     * Service health check
     */
    @GetMapping("/health")
    public ResponseEntity<Object> health() {
        return ResponseEntity.ok(java.util.Map.of(
            "status", "UP",
            "service", "certificate-service",
            "timestamp", java.time.LocalDateTime.now()
        ));
    }
}
