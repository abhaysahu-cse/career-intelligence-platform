package com.cip.certificate.repository;

import com.cip.certificate.entity.CertificateResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CertificateResultRepository extends JpaRepository<CertificateResult, Long> {
    Optional<CertificateResult> findByCertificateId(Long certificateId);
}
