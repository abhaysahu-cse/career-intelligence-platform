package com.cip.interview.controller;

import com.cip.common.dto.ApiResponse;
import com.cip.interview.dto.InterviewDtos;
import com.cip.interview.service.InterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/interview")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<InterviewDtos.InterviewResponse>> start(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody InterviewDtos.StartRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Interview started",
                interviewService.startInterview(userId, request)));
    }

    @PostMapping("/answer")
    public ResponseEntity<ApiResponse<InterviewDtos.InterviewResponse>> answer(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody InterviewDtos.AnswerRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Answer recorded",
                interviewService.submitAnswer(userId, request)));
    }

    @PostMapping("/end")
    public ResponseEntity<ApiResponse<InterviewDtos.InterviewResponse>> end(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam Long interviewId) {
        return ResponseEntity.ok(ApiResponse.success("Interview completed",
                interviewService.endInterview(userId, interviewId)));
    }

    @GetMapping("/result/{id}")
    public ResponseEntity<ApiResponse<InterviewDtos.InterviewResponse>> getResult(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(interviewService.getResult(userId, id)));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<InterviewDtos.InterviewResponse>>> history(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(ApiResponse.success(interviewService.getHistory(userId)));
    }
}
