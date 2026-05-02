package com.cip.resume.controller;

import com.cip.common.dto.ApiResponse;
import com.cip.resume.entity.Resume;
import com.cip.resume.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/resume")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Resume>> upload(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam("file") MultipartFile file) throws IOException {
        Resume resume = resumeService.uploadResume(userId, file);
        return ResponseEntity.ok(ApiResponse.success("Resume uploaded. Parsing in progress.", resume));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Resume>>> getResumes(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(ApiResponse.success(resumeService.getResumes(userId)));
    }

    @GetMapping("/latest")
    public ResponseEntity<ApiResponse<Resume>> getLatest(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(ApiResponse.success(resumeService.getLatestResume(userId)));
    }
}
