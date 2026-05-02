package com.cip.recommendation.controller;

import com.cip.common.dto.ApiResponse;
import com.cip.recommendation.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    /** GET /roadmap — personalized learning roadmap */
    @GetMapping("/roadmap")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRoadmap(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false) String role,
            @RequestParam(required = false, defaultValue = "Developing") String level,
            @RequestParam(required = false) List<String> skills) {
        return ResponseEntity.ok(ApiResponse.success(
                recommendationService.getRoadmap(role, level, skills != null ? skills : List.of())));
    }

    /** GET /recommendations/skills — what to learn next */
    @GetMapping("/recommendations/skills")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSkillRecommendations(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "50.0") double readiness,
            @RequestParam(required = false) List<String> skills,
            @RequestParam(required = false) String targetRole) {
        return ResponseEntity.ok(ApiResponse.success(
                recommendationService.getSkillRecommendations(userId, readiness,
                        skills != null ? skills : List.of(), targetRole)));
    }

    /** GET /recommendations/resources — curated learning resources */
    @GetMapping("/recommendations/resources")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getResources(
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) String type) {
        return ResponseEntity.ok(ApiResponse.success(
                recommendationService.getLearningResources(skill, type)));
    }
}
