package com.cip.certificate.repository;

import com.cip.certificate.entity.Certificate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    List<Certificate> findByUserIdOrderByCreatedAtDesc(Long userId);
    Page<Certificate> findByUserId(Long userId, Pageable pageable);
    Optional<Certificate> findByFileHash(String fileHash);
}
