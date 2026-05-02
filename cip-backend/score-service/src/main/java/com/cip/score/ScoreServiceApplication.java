package com.cip.score;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication(scanBasePackages = {"com.cip.score", "com.cip.common"})
@EnableCaching
public class ScoreServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ScoreServiceApplication.class, args);
    }
}
