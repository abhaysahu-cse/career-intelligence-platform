package com.cip.certificate.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class CertificateEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private static final String TOPIC = "certificate-events";

    public void publishUploaded(Long certId, Long userId, String fileUrl) {
        Map<String, Object> event = new HashMap<>();
        event.put("event_type", "CERTIFICATE_UPLOADED");
        event.put("certificate_id", certId.toString());
        event.put("user_id", userId.toString());
        event.put("file_url", fileUrl);
        event.put("timestamp", Instant.now().getEpochSecond());
        send(certId.toString(), event);
    }

    public void publishProcessed(Long certId, Long userId, Map<String, Object> payload) {
        Map<String, Object> event = new HashMap<>();
        event.put("event_type", "CERTIFICATE_VALIDATED");
        event.put("certificate_id", certId.toString());
        event.put("user_id", userId.toString());
        event.put("payload", Map.of(
            "authenticity_score", payload.getOrDefault("authenticity_score", 0),
            "status", payload.getOrDefault("status", "Unknown")
        ));
        event.put("timestamp", Instant.now().getEpochSecond());
        send(certId.toString(), event);
    }

    public void publishFailed(Long certId, Long userId, String error) {
        Map<String, Object> event = new HashMap<>();
        event.put("event_type", "CERTIFICATE_FAILED");
        event.put("certificate_id", certId.toString());
        event.put("user_id", userId.toString());
        event.put("error", error);
        event.put("timestamp", Instant.now().getEpochSecond());
        send(certId.toString(), event);
    }

    private void send(String key, Map<String, Object> event) {
        try {
            kafkaTemplate.send(TOPIC, key, event);
            log.info("[Kafka] Published: topic={}, event_type={}, certId={}", TOPIC, event.get("event_type"), key);
        } catch (Exception e) {
            log.error("[Kafka] Publish failed: {}", e.getMessage());
        }
    }
}
