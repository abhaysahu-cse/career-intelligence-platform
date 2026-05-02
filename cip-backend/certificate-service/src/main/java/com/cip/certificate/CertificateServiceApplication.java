package com.cip.certificate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class CertificateServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(CertificateServiceApplication.class, args);
    }
}
