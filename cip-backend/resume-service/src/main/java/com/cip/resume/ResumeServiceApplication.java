package com.cip.resume;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"com.cip.resume", "com.cip.common"})
public class ResumeServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ResumeServiceApplication.class, args);
    }
}
