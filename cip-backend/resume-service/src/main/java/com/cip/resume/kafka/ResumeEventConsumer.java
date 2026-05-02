package com.cip.resume.kafka;

import com.cip.common.events.CipEvent;
import com.cip.common.events.KafkaTopics;
import com.cip.resume.service.ResumeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ResumeEventConsumer {

    private final ResumeService resumeService;

    /** Listens for ML service publishing resume parsing results */
    @KafkaListener(topics = KafkaTopics.RESUME_PARSED, groupId = "resume-service")
    public void onResumeParsed(CipEvent event) {
        try {
            Map<String, Object> payload = (Map<String, Object>) event.getPayload();
            String resumeId = (String) payload.get("resumeId");
            Object parsedData = payload.get("parsedData");
            Double score = ((Number) payload.get("resumeScore")).doubleValue();

            resumeService.updateParsedData(resumeId, parsedData, score);
            log.info("Processed resume.parsed event for resumeId={}", resumeId);
        } catch (Exception e) {
            log.error("Error processing resume.parsed event: {}", e.getMessage(), e);
        }
    }
}
