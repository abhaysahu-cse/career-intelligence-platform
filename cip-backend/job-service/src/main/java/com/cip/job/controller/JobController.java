package com.cip.job.controller;

import com.cip.common.dto.ApiResponse;
import com.cip.job.entity.Job;
import com.cip.job.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Job>>> getAllJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(jobService.getAllJobs(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Job>> getJob(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(jobService.getJobById(id)));
    }

    /**
     * GET /jobs/recommended
     * Requires: readiness score + student skills passed as query/header
     * In production the gateway enriches these from the score-service call
     */
    @GetMapping("/recommended")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRecommended(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "50.0") double readiness,
            @RequestParam(required = false) List<String> skills) {
        List<String> studentSkills = skills != null ? skills : List.of();
        return ResponseEntity.ok(ApiResponse.success(
                jobService.getRecommendedJobs(userId, readiness, studentSkills)));
    }

    // Admin endpoints
    @PostMapping
    public ResponseEntity<ApiResponse<Job>> createJob(
            @RequestHeader("X-User-Role") String role,
            @RequestBody Job job) {
        if (!"ADMIN".equals(role))
            return ResponseEntity.status(403).body(ApiResponse.error("Admin access required"));
        return ResponseEntity.ok(ApiResponse.success("Job created", jobService.createJob(job)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Job>> updateJob(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String role,
            @RequestBody Job updates) {
        if (!"ADMIN".equals(role))
            return ResponseEntity.status(403).body(ApiResponse.error("Admin access required"));
        return ResponseEntity.ok(ApiResponse.success("Job updated", jobService.updateJob(id, updates)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivateJob(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String role) {
        if (!"ADMIN".equals(role))
            return ResponseEntity.status(403).body(ApiResponse.error("Admin access required"));
        jobService.deactivateJob(id);
        return ResponseEntity.ok(ApiResponse.success("Job deactivated", null));
    }
}
