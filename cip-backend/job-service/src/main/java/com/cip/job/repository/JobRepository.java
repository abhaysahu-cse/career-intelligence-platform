package com.cip.job.repository;

import com.cip.job.entity.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
    Page<Job> findByActiveTrue(Pageable pageable);

    @Query("SELECT j FROM Job j WHERE j.active = true AND j.minimumReadinessScore <= :readiness")
    List<Job> findJobsMatchingReadiness(Double readiness);

    List<Job> findByActiveTrueAndExperienceLevel(String level);

    @Query("SELECT j FROM Job j WHERE j.active = true AND j.company LIKE %:company%")
    List<Job> searchByCompany(String company);
}
