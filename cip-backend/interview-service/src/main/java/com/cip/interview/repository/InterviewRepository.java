package com.cip.interview.repository;

import com.cip.interview.entity.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {
    List<Interview> findByUserIdOrderByStartedAtDesc(Long userId);
    Optional<Interview> findByIdAndUserId(Long id, Long userId);
    List<Interview> findByUserIdAndStatus(Long userId, Interview.InterviewStatus status);
}
