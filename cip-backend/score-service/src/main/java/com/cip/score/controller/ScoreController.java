package com.cip.score.controller;

import com.cip.common.dto.ApiResponse;
import com.cip.score.dto.ScoreDtos;
import com.cip.score.entity.Score;
import com.cip.score.service.ScoreEngine;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/score")
@RequiredArgsConstructor
public class ScoreController {

    private final ScoreEngine scoreEngine;

    @GetMapping
    public ResponseEntity<ApiResponse<ScoreDtos.ScoreResponse>> getScore(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(ApiResponse.success(scoreEngine.getScore(userId)));
    }

    @PostMapping("/update")
    public ResponseEntity<ApiResponse<ScoreDtos.ScoreResponse>> updateScore(
            @RequestHeader("X-User-Role") String role,
            @RequestBody ScoreDtos.UpdateScoreRequest request) {
        // Only ADMIN or internal services can call this
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body(ApiResponse.error("Admin access required"));
        }
        return ResponseEntity.ok(ApiResponse.success("Score updated", scoreEngine.updateScore(request)));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<ApiResponse<List<Score>>> getLeaderboard(
            @RequestHeader("X-User-Role") String role) {
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body(ApiResponse.error("Admin access required"));
        }
        return ResponseEntity.ok(ApiResponse.success(scoreEngine.getLeaderboard()));
    }
}
