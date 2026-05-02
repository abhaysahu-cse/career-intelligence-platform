package com.cip.common.events;

public class KafkaTopics {
    // Use dash notation to match Kafka topic names and ML consumer expectations
    public static final String INTERVIEW_EVENTS = "interview-events";
    public static final String RESUME_EVENTS = "resume-events";
    public static final String SCORE_EVENTS = "score-events";
    public static final String STUDENT_EVENTS = "student-events";
    public static final String JOB_EVENTS = "job-events";
    public static final String NOTIFICATION_EVENTS = "notification-events";
    public static final String CERTIFICATE_EVENTS = "certificate-events";
    
    // Legacy constants for backward compatibility (deprecated)
    @Deprecated public static final String INTERVIEW_COMPLETED = INTERVIEW_EVENTS;
    @Deprecated public static final String RESUME_UPLOADED = RESUME_EVENTS;
    @Deprecated public static final String SCORE_UPDATED = SCORE_EVENTS;
    @Deprecated public static final String STUDENT_UPDATED = STUDENT_EVENTS;
    @Deprecated public static final String RESUME_PARSED = "resume.parsed";
    @Deprecated public static final String JOB_RECOMMENDATION_REQUESTED = "job.recommendation.requested";
}
