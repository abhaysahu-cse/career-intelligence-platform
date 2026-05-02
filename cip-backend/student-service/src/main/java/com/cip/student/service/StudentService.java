package com.cip.student.service;

import com.cip.common.events.CipEvent;
import com.cip.common.events.KafkaTopics;
import com.cip.common.exception.CipException;
import com.cip.student.dto.StudentDtos;
import com.cip.student.entity.StudentProfile;
import com.cip.student.repository.StudentProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentProfileRepository profileRepository;
    private final KafkaTemplate<String, CipEvent> kafkaTemplate;

    @Cacheable(value = "student-profile", key = "#userId")
    public StudentDtos.ProfileResponse getProfile(Long userId) {
        StudentProfile profile = profileRepository.findById(userId)
                .orElseThrow(() -> CipException.notFound("Student profile"));
        return toProfileResponse(profile);
    }

    @Transactional
    @CacheEvict(value = "student-profile", key = "#userId")
    public StudentDtos.ProfileResponse createOrUpdateProfile(Long userId, String name,
                                                              String email,
                                                              StudentDtos.UpdateProfileRequest request) {
        StudentProfile profile = profileRepository.findById(userId)
                .orElse(StudentProfile.builder()
                        .userId(userId)
                        .name(name)
                        .email(email)
                        .build());

        if (request.getPhone() != null) profile.setPhone(request.getPhone());
        if (request.getInstitution() != null) profile.setInstitution(request.getInstitution());
        if (request.getDepartment() != null) profile.setDepartment(request.getDepartment());
        if (request.getGraduationYear() != null) profile.setGraduationYear(request.getGraduationYear());
        if (request.getLinkedinUrl() != null) profile.setLinkedinUrl(request.getLinkedinUrl());
        if (request.getGithubUrl() != null) profile.setGithubUrl(request.getGithubUrl());
        if (request.getSkills() != null) profile.setSkills(request.getSkills());
        if (request.getAcademicData() != null) profile.setAcademicData(request.getAcademicData());
        if (request.getWorkExperience() != null) profile.setWorkExperience(request.getWorkExperience());
        if (request.getCertifications() != null) profile.setCertifications(request.getCertifications());

        profile = profileRepository.save(profile);

        // Publish student.updated event so score service can recalculate
        CipEvent event = CipEvent.studentUpdated(userId);
        kafkaTemplate.send(KafkaTopics.STUDENT_UPDATED, userId.toString(), event);
        log.info("Published student.updated event for userId={}", userId);

        return toProfileResponse(profile);
    }

    private StudentDtos.ProfileResponse toProfileResponse(StudentProfile p) {
        return StudentDtos.ProfileResponse.builder()
                .userId(p.getUserId())
                .name(p.getName())
                .email(p.getEmail())
                .phone(p.getPhone())
                .institution(p.getInstitution())
                .department(p.getDepartment())
                .graduationYear(p.getGraduationYear())
                .linkedinUrl(p.getLinkedinUrl())
                .githubUrl(p.getGithubUrl())
                .skills(p.getSkills())
                .academicData(p.getAcademicData())
                .workExperience(p.getWorkExperience())
                .certifications(p.getCertifications())
                .build();
    }
}
