package com.thesisdisplay.backend.repo;

import com.thesisdisplay.backend.entity.MailQuota;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MailQuotaRepository extends JpaRepository<MailQuota, String> {
}
