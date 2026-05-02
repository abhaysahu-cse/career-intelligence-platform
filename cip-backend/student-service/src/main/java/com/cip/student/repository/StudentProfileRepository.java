package com.cip.student.repository;

import com.cip.student.entity.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {
    Optional<StudentProfile> findByEmail(String email);
    List<StudentProfile> findByInstitution(String institution);
    List<StudentProfile> findByGraduationYear(Integer graduationYear);
}
