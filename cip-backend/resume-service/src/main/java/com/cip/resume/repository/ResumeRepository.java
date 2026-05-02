package com.cip.resume.repository;

import com.cip.resume.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, String> {
    List<Resume> findByUserIdOrderByUploadedAtDesc(Long userId);
    Optional<Resume> findTopByUserIdOrderByUploadedAtDesc(Long userId);
    List<Resume> findByParseStatus(Resume.ParseStatus status);
}
