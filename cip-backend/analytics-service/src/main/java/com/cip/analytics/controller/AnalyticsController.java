package com.cip.analytics.controller;

import com.cip.analytics.service.AnalyticsService;
import com.cip.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyAnalytics(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getStudentAnalytics(userId)));
    }

    @GetMapping("/platform")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPlatformAnalytics(
            @RequestHeader("X-User-Role") String role) {
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body(ApiResponse.error("Admin access required"));
        }
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getPlatformAnalytics()));
    }

    @GetMapping("/student/{userId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStudentAnalytics(
            @PathVariable Long userId,
            @RequestHeader("X-User-Role") String role) {
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body(ApiResponse.error("Admin access required"));
        }
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getStudentAnalytics(userId)));
    }
}
