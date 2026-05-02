package com.cip.certificate.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.UUID;

@Service
@Slf4j
public class StorageService {

    @Value("${storage.type:local}")
    private String storageType;

    @Value("${storage.local.path:./storage/certificates}")
    private String localStoragePath;

    /**
     * Store uploaded file. Returns the absolute file path (local) or S3 URL.
     */
    public String store(MultipartFile file, Long userId) throws IOException {
        if ("s3".equalsIgnoreCase(storageType)) {
            return storeS3(file, userId);
        }
        return storeLocal(file, userId);
    }

    private String storeLocal(MultipartFile file, Long userId) throws IOException {
        // Build path: storage/certificates/{userId}/{date}/{uuid}_{filename}
        String date = LocalDate.now().toString();
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        String originalName = file.getOriginalFilename() != null
            ? file.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_")
            : "certificate";

        String relativePath = userId + "/" + date + "/" + uuid + "_" + originalName;
        Path fullPath = Paths.get(localStoragePath, relativePath);

        // Create directories
        Files.createDirectories(fullPath.getParent());

        // Write file
        file.transferTo(fullPath.toAbsolutePath().toFile());

        log.info("[Storage] Saved locally: {}", fullPath.toAbsolutePath());
        return fullPath.toAbsolutePath().toString();
    }

    private String storeS3(MultipartFile file, Long userId) throws IOException {
        // AWS S3 implementation — inject AmazonS3 bean when needed
        log.warn("[Storage] S3 storage not configured, falling back to local");
        return storeLocal(file, userId);
    }

    public void delete(String fileUrl) {
        try {
            File file = new File(fileUrl);
            if (file.exists()) {
                file.delete();
                log.info("[Storage] Deleted: {}", fileUrl);
            }
        } catch (Exception e) {
            log.warn("[Storage] Delete failed: {}", e.getMessage());
        }
    }
}
