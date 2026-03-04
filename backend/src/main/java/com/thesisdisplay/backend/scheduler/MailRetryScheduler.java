package com.thesisdisplay.backend.scheduler;

import com.thesisdisplay.backend.service.MailSubmissionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class MailRetryScheduler {

    private static final Logger log = LoggerFactory.getLogger(MailRetryScheduler.class);

    private final MailSubmissionService mailSubmissionService;
    public MailRetryScheduler(MailSubmissionService mailSubmissionService) {
        this.mailSubmissionService = mailSubmissionService;
    }

    @Scheduled(fixedDelayString = "${app.mail.retry-poll-interval-ms:30000}")
    public void processRetryQueue() {
        try {
            mailSubmissionService.processPendingRetryTasks();
        } catch (Exception ex) {
            log.error("Retry queue processor failed", ex);
        }
    }
}
