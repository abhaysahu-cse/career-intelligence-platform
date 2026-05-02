package com.cip.student.controller;

import com.cip.common.dto.ApiResponse;
import com.cip.student.dto.StudentDtos;
import com.cip.student.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/student")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<StudentDtos.ProfileResponse>> getProfile(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(ApiResponse.success(studentService.getProfile(userId)));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<StudentDtos.ProfileResponse>> updateProfile(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Email") String email,
            @RequestHeader("X-User-Role") String name,
            @RequestBody StudentDtos.UpdateProfileRequest request) {
        // name comes encoded in the token; here we just use email as fallback name
        StudentDtos.ProfileResponse updated = studentService.createOrUpdateProfile(userId, email, email, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated", updated));
    }

    // Admin endpoint - get any student profile by ID
    @GetMapping("/profile/{userId}")
    public ResponseEntity<ApiResponse<StudentDtos.ProfileResponse>> getProfileById(
            @PathVariable Long userId,
            @RequestHeader("X-User-Role") String role) {
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403)
                    .body(ApiResponse.error("Access denied"));
        }
        return ResponseEntity.ok(ApiResponse.success(studentService.getProfile(userId)));
    }
}
