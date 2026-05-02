package com.cip.job.service;

import com.cip.common.exception.CipException;
import com.cip.job.entity.Job;
import com.cip.job.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;

    private static final double SKILL_MATCH_THRESHOLD = 0.70; // 70%

    @Cacheable(value = "all-jobs", key = "#page + '-' + #size")
    public Page<Job> getAllJobs(int page, int size) {
        return jobRepository.findByActiveTrue(
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    /**
     * Job Recommendation Logic:
     * If readiness > threshold AND skill match > 70% → recommend
     */
    @Cacheable(value = "recommended-jobs", key = "#userId + '-' + #readiness")
    public List<Map<String, Object>> getRecommendedJobs(Long userId, double readiness,
                                                          List<String> studentSkills) {
        List<Job> candidateJobs = jobRepository.findJobsMatchingReadiness(readiness);
        List<Map<String, Object>> recommended = new ArrayList<>();

        for (Job job : candidateJobs) {
            double skillMatchPct = computeSkillMatch(studentSkills, job.getRequiredSkills());
            if (skillMatchPct >= SKILL_MATCH_THRESHOLD) {
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("job", job);
                entry.put("matchPercentage", Math.round(skillMatchPct * 100));
                entry.put("readinessMatch", readiness >= job.getMinimumReadinessScore());
                entry.put("matchedSkills", getMatchedSkills(studentSkills, job.getRequiredSkills()));
                entry.put("missingSkills", getMissingSkills(studentSkills, job.getRequiredSkills()));
                recommended.add(entry);
            }
        }

        // Sort by match percentage descending
        recommended.sort((a, b) -> {
            int ma = (int) a.get("matchPercentage");
            int mb = (int) b.get("matchPercentage");
            return Integer.compare(mb, ma);
        });

        log.info("Found {} recommended jobs for userId={}, readiness={}", recommended.size(), userId, readiness);
        return recommended;
    }

    public Job getJobById(Long id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> CipException.notFound("Job"));
    }

    @Transactional
    @CacheEvict(value = {"all-jobs", "recommended-jobs"}, allEntries = true)
    public Job createJob(Job job) {
        return jobRepository.save(job);
    }

    @Transactional
    @CacheEvict(value = {"all-jobs", "recommended-jobs"}, allEntries = true)
    public Job updateJob(Long id, Job updates) {
        Job job = getJobById(id);
        if (updates.getCompany() != null) job.setCompany(updates.getCompany());
        if (updates.getRole() != null) job.setRole(updates.getRole());
        if (updates.getDescription() != null) job.setDescription(updates.getDescription());
        if (updates.getMinimumReadinessScore() != null) job.setMinimumReadinessScore(updates.getMinimumReadinessScore());
        if (updates.getRequiredSkills() != null) job.setRequiredSkills(updates.getRequiredSkills());
        return jobRepository.save(job);
    }

    @Transactional
    @CacheEvict(value = {"all-jobs", "recommended-jobs"}, allEntries = true)
    public void deactivateJob(Long id) {
        Job job = getJobById(id);
        job.setActive(false);
        jobRepository.save(job);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private double computeSkillMatch(List<String> studentSkills, Object requiredSkillsObj) {
        if (requiredSkillsObj == null) return 1.0;
        List<String> required = normalizeSkillList(requiredSkillsObj);
        if (required.isEmpty()) return 1.0;
        if (studentSkills == null || studentSkills.isEmpty()) return 0.0;

        long matched = required.stream()
                .filter(r -> studentSkills.stream()
                        .anyMatch(s -> s.equalsIgnoreCase(r)))
                .count();
        return (double) matched / required.size();
    }

    private List<String> getMatchedSkills(List<String> studentSkills, Object requiredSkillsObj) {
        if (studentSkills == null) return List.of();
        List<String> required = normalizeSkillList(requiredSkillsObj);
        return required.stream()
                .filter(r -> studentSkills.stream().anyMatch(s -> s.equalsIgnoreCase(r)))
                .toList();
    }

    private List<String> getMissingSkills(List<String> studentSkills, Object requiredSkillsObj) {
        List<String> required = normalizeSkillList(requiredSkillsObj);
        if (studentSkills == null) return required;
        return required.stream()
                .filter(r -> studentSkills.stream().noneMatch(s -> s.equalsIgnoreCase(r)))
                .toList();
    }

    @SuppressWarnings("unchecked")
    private List<String> normalizeSkillList(Object obj) {
        if (obj instanceof List<?> list) {
            return list.stream()
                    .map(item -> item instanceof String s ? s : item.toString())
                    .toList();
        }
        return List.of();
    }
}
