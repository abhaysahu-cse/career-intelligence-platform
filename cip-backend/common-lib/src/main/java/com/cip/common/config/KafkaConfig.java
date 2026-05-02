package com.cip.common.config;

import com.cip.common.events.CipEvent;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers:localhost:9092}")
    private String bootstrapServers;

    @Bean
    public ProducerFactory<String, CipEvent> producerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        config.put(ProducerConfig.ACKS_CONFIG, "all");
        config.put(ProducerConfig.RETRIES_CONFIG, 3);
        config.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        return new DefaultKafkaProducerFactory<>(config);
    }

    @Bean
    public KafkaTemplate<String, CipEvent> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    // Auto-create topics on startup
    @Bean public NewTopic resumeUploadedTopic()    { return TopicBuilder.name("resume.uploaded").partitions(3).replicas(1).build(); }
    @Bean public NewTopic resumeParsedTopic()      { return TopicBuilder.name("resume.parsed").partitions(3).replicas(1).build(); }
    @Bean public NewTopic interviewCompletedTopic(){ return TopicBuilder.name("interview.completed").partitions(3).replicas(1).build(); }
    @Bean public NewTopic scoreUpdatedTopic()      { return TopicBuilder.name("score.updated").partitions(3).replicas(1).build(); }
    @Bean public NewTopic studentUpdatedTopic()    { return TopicBuilder.name("student.updated").partitions(3).replicas(1).build(); }
}
