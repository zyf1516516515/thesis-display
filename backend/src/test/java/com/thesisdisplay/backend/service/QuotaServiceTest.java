package com.thesisdisplay.backend.service;

import com.thesisdisplay.backend.config.MailServiceProperties;
import com.thesisdisplay.backend.dto.MailQuotaSnapshot;
import com.thesisdisplay.backend.repo.MailQuotaRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class QuotaServiceTest {

    @Autowired
    private QuotaService quotaService;

    @Autowired
    private MailQuotaRepository quotaRepository;

    @Autowired
    private MailServiceProperties properties;

    @Test
    void shouldBlockAfterDailyLimit() {
        String email = "quota-test@example.com";
        quotaRepository.deleteById(email);

        for (int i = 0; i < properties.getDailyLimit(); i++) {
            quotaService.consumeQuota(email);
        }

        QuotaService.QuotaDecision decision = quotaService.checkQuota(email);
        Assertions.assertFalse(decision.allowed());
        Assertions.assertEquals("RATE_LIMIT_DAILY", decision.code());

        MailQuotaSnapshot snapshot = decision.snapshot();
        Assertions.assertEquals(properties.getDailyLimit(), snapshot.getDailyUsed());
    }
}
