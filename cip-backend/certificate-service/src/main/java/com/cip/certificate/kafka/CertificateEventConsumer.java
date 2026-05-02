package com.cip.certificate.kafka;

import com.cip.certificate.service.CertificateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class CertificateEventConsumer {

    private final CertificateService certificateService;

    @KafkaListener(
        topics = "certificate-events",
        groupId = "certificate-service-group",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(Map<String, Object> event) {
        String eventType = (String) event.getOrDefault("event_type", "");
        log.info("[Kafka Consumer] Received: event_type={}", eventType);

        try {
            switch (eventType) {
                case "CERTIFICATE_PROCESSED" -> handleProcessed(event);
                default -> log.debug("[Kafka Consumer] Unhandled event: {}", eventType);
            }
        } catch (Exception e) {
            log.error("[Kafka Consumer] Handler error for event_type={}: {}", eventType, e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private void handleProcessed(Map<String, Object> event) {
        String certIdStr = (String) event.get("certificate_id");
        if (certIdStr == null) return;

        Long certId = Long.parseLong(certIdStr);
        Map<String, Object> payload = (Map<String, Object>) event.get("payload");

        if (payload != null) {
            // Save result if it came via Kafka (from ML service)
            certificateService.saveResult(certId, payload);
            log.info("[Kafka Consumer] Saved ML result for certId={}", certId);
        }
    }
}
