package com.cip.score.repository;

import com.cip.score.entity.Score;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScoreRepository extends JpaRepository<Score, Long> {

    @Query("SELECT s FROM Score s ORDER BY s.readiness DESC")
    List<Score> findTopScores();

    @Query("SELECT AVG(s.readiness) FROM Score s")
    Double findAverageReadiness();

    List<Score> findByReadinessGreaterThanEqual(Double threshold);
}
