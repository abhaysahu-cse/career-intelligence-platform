package com.cip.resume.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Slf4j
@Service
public class StorageService {

    @Value("${storage.type:local}")
    private String storageType;

    @Value("${storage.local.path:./uploads}")
    private String localPath;

    @Value("${storage.s3.bucket:cip-resumes}")
    private String s3Bucket;

    @Value("${storage.s3.region:ap-south-1}")
    private String s3Region;

    private S3Client s3Client;

    public String store(MultipartFile file, Long userId) throws IOException {
        String filename = userId + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();

        if ("s3".equals(storageType)) {
            return storeToS3(file, filename);
        } else {
            return storeLocally(file, filename);
        }
    }

    private String storeToS3(MultipartFile file, String key) throws IOException {
        if (s3Client == null) {
            s3Client = S3Client.builder().build();
        }
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(s3Bucket)
                .key(key)
                .contentType(file.getContentType())
                .build();
        s3Client.putObject(request, RequestBody.fromBytes(file.getBytes()));
        return "https://" + s3Bucket + ".s3." + s3Region + ".amazonaws.com/" + key;
    }

    private String storeLocally(MultipartFile file, String filename) throws IOException {
        Path dir = Paths.get(localPath, filename).getParent();
        Files.createDirectories(dir);
        Path dest = Paths.get(localPath, filename);
        file.transferTo(dest.toAbsolutePath().toFile());
        return "/uploads/" + filename;
    }
}
