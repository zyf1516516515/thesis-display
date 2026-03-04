package com.thesisdisplay.backend.repo;

import com.thesisdisplay.backend.entity.MailSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MailSubmissionRepository extends JpaRepository<MailSubmission, Long> {
    Optional<MailSubmission> findByRequestId(String requestId);
}
