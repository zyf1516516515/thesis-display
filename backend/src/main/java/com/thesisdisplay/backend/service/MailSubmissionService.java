package com.thesisdisplay.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.thesisdisplay.backend.config.MailServiceProperties;
import com.thesisdisplay.backend.dto.ContactSubmissionRequest;
import com.thesisdisplay.backend.dto.DatasetSubmissionRequest;
import com.thesisdisplay.backend.dto.MailContent;
import com.thesisdisplay.backend.dto.MailQuotaSnapshot;
import com.thesisdisplay.backend.dto.MailSendResult;
import com.thesisdisplay.backend.dto.MailStatusResponse;
import com.thesisdisplay.backend.dto.MailSubmitResponse;
import com.thesisdisplay.backend.entity.MailRetryTask;
import com.thesisdisplay.backend.entity.MailSubmission;
import com.thesisdisplay.backend.enums.DeliveryStatus;
import com.thesisdisplay.backend.enums.RetryTaskStatus;
import com.thesisdisplay.backend.enums.RetryTaskType;
import com.thesisdisplay.backend.enums.SubmissionStatus;
import com.thesisdisplay.backend.enums.SubmissionType;
import com.thesisdisplay.backend.exception.ApiException;
import com.thesisdisplay.backend.repo.MailRetryTaskRepository;
import com.thesisdisplay.backend.repo.MailSubmissionRepository;
import com.thesisdisplay.backend.util.EmailUtil;
import com.thesisdisplay.backend.util.MailCodes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class MailSubmissionService {

    private static final Logger log = LoggerFactory.getLogger(MailSubmissionService.class);

    private final ObjectMapper objectMapper;
    private final MailSubmissionRepository submissionRepository;
    private final MailRetryTaskRepository retryTaskRepository;
    private final QuotaService quotaService;
    private final MailTemplateService templateService;
    private final SmtpMailService smtpMailService;
    private final MailServiceProperties properties;

    public MailSubmissionService(
        ObjectMapper objectMapper,
        MailSubmissionRepository submissionRepository,
        MailRetryTaskRepository retryTaskRepository,
        QuotaService quotaService,
        MailTemplateService templateService,
        SmtpMailService smtpMailService,
        MailServiceProperties properties
    ) {
        this.objectMapper = objectMapper;
        this.submissionRepository = submissionRepository;
        this.retryTaskRepository = retryTaskRepository;
        this.quotaService = quotaService;
        this.templateService = templateService;
        this.smtpMailService = smtpMailService;
        this.properties = properties;
    }

    public MailSubmitResponse submitContact(ContactSubmissionRequest request, String origin) {
        String requestId = resolveRequestId(request.getRequestId());
        Optional<MailSubmission> existing = submissionRepository.findByRequestId(requestId);
        if (existing.isPresent()) {
            return toIdempotentResponse(existing.get());
        }

        String userEmail = EmailUtil.normalize(request.getUserEmail());
        QuotaService.QuotaDecision quotaDecision = quotaService.checkQuota(userEmail);
        if (!quotaDecision.allowed()) {
            return buildResponse(false, quotaDecision.code(), "FAILED", quotaDecision.message(), requestId, false, quotaDecision.snapshot());
        }

        String locale = resolveLocale(request.getLocale());
        MailContent userMail = templateService.buildUserContactThankYou(request, requestId, origin);
        MailContent adminMail = templateService.buildAdminContactMail(request, requestId, origin);

        MailSubmission submission = new MailSubmission();
        submission.setRequestId(requestId);
        submission.setSubmitType(SubmissionType.CONTACT);
        submission.setUserEmail(userEmail);
        submission.setLocale(locale);
        submission.setPayloadJson(toJson(request));
        submission.setStatus(SubmissionStatus.PENDING);
        submission.setUserMailStatus(DeliveryStatus.PENDING);
        submission.setAdminMailStatus(DeliveryStatus.PENDING);
        submission.setUserMailSubject(userMail.getSubject());
        submission.setAdminMailSubject(adminMail.getSubject());
        submission.setAdminMailHtml(adminMail.getHtml());
        submissionRepository.save(submission);

        return sendInOrder(submission, userMail, adminMail);
    }

    public MailSubmitResponse submitDataset(DatasetSubmissionRequest request, String origin) {
        String requestId = resolveRequestId(request.getRequestId());
        Optional<MailSubmission> existing = submissionRepository.findByRequestId(requestId);
        if (existing.isPresent()) {
            return toIdempotentResponse(existing.get());
        }

        String userEmail = EmailUtil.normalize(request.getUserEmail());
        QuotaService.QuotaDecision quotaDecision = quotaService.checkQuota(userEmail);
        if (!quotaDecision.allowed()) {
            return buildResponse(false, quotaDecision.code(), "FAILED", quotaDecision.message(), requestId, false, quotaDecision.snapshot());
        }

        String locale = resolveLocale(request.getLocale());
        MailContent userMail = templateService.buildUserDatasetThankYou(request, requestId, origin);
        MailContent adminMail = templateService.buildAdminDatasetMail(request, requestId, origin);

        MailSubmission submission = new MailSubmission();
        submission.setRequestId(requestId);
        submission.setSubmitType(SubmissionType.DATASET);
        submission.setUserEmail(userEmail);
        submission.setLocale(locale);
        submission.setPayloadJson(toJson(request));
        submission.setStatus(SubmissionStatus.PENDING);
        submission.setUserMailStatus(DeliveryStatus.PENDING);
        submission.setAdminMailStatus(DeliveryStatus.PENDING);
        submission.setUserMailSubject(userMail.getSubject());
        submission.setAdminMailSubject(adminMail.getSubject());
        submission.setAdminMailHtml(adminMail.getHtml());
        submissionRepository.save(submission);

        return sendInOrder(submission, userMail, adminMail);
    }

    @Transactional(readOnly = true)
    public MailStatusResponse getStatus(String requestId) {
        MailSubmission submission = submissionRepository.findByRequestId(requestId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, MailCodes.NOT_FOUND, "Request ID not found."));

        MailStatusResponse response = new MailStatusResponse();
        response.setRequestId(submission.getRequestId());
        response.setStatus(submission.getStatus().name());
        response.setUserMailStatus(submission.getUserMailStatus().name());
        response.setAdminMailStatus(submission.getAdminMailStatus().name());
        response.setLastErrorCode(submission.getLastErrorCode());
        response.setLastErrorDetail(submission.getLastErrorDetail());
        return response;
    }

    @Transactional
    public void processPendingRetryTasks() {
        List<MailRetryTask> tasks = retryTaskRepository
            .findTop50ByStatusAndNextAttemptAtLessThanEqualOrderByNextAttemptAtAsc(RetryTaskStatus.PENDING, Instant.now());

        if (tasks.isEmpty()) {
            return;
        }

        int batchLimit = Math.max(1, properties.getRetryBatchSize());
        for (int i = 0; i < Math.min(batchLimit, tasks.size()); i++) {
            MailRetryTask task = tasks.get(i);
            processSingleRetryTask(task);
        }
    }

    private MailSubmitResponse sendInOrder(MailSubmission submission, MailContent userMail, MailContent adminMail) {
        MailSendResult userSend = smtpMailService.sendHtml(submission.getUserEmail(), userMail);
        if (!userSend.isOk()) {
            submission.setStatus(SubmissionStatus.FAILED);
            submission.setUserMailStatus(DeliveryStatus.FAILED);
            submission.setAdminMailStatus(DeliveryStatus.PENDING);
            submission.setLastErrorCode(MailCodes.USER_MAIL_SEND_FAILED);
            submission.setLastErrorDetail(userSend.getDetail());
            submissionRepository.save(submission);
            return buildResponse(
                false,
                MailCodes.USER_MAIL_SEND_FAILED,
                "FAILED",
                "Failed to deliver thank-you email.",
                submission.getRequestId(),
                false,
                quotaService.currentSnapshot(submission.getUserEmail())
            );
        }

        submission.setStatus(SubmissionStatus.USER_MAIL_SENT);
        submission.setUserMailStatus(DeliveryStatus.SENT);
        submission.setLastErrorCode(null);
        submission.setLastErrorDetail(null);
        submissionRepository.save(submission);

        MailQuotaSnapshot consumed = quotaService.consumeQuota(submission.getUserEmail());

        MailSendResult adminSend = smtpMailService.sendHtml(properties.getTargetEmail(), adminMail);
        if (!adminSend.isOk()) {
            submission.setStatus(SubmissionStatus.PARTIAL_SUCCESS);
            submission.setAdminMailStatus(DeliveryStatus.FAILED);
            submission.setLastErrorCode(MailCodes.ADMIN_MAIL_SEND_FAILED);
            submission.setLastErrorDetail(adminSend.getDetail());
            submissionRepository.save(submission);
            upsertRetryTask(submission.getRequestId(), adminSend.getDetail());

            return buildResponse(
                true,
                MailCodes.PARTIAL_SUCCESS_ADMIN_RETRYING,
                "PARTIAL_SUCCESS",
                "Thank-you email delivered. Admin email failed and has been queued for retry.",
                submission.getRequestId(),
                true,
                consumed
            );
        }

        submission.setStatus(SubmissionStatus.DONE);
        submission.setAdminMailStatus(DeliveryStatus.SENT);
        submission.setLastErrorCode(null);
        submission.setLastErrorDetail(null);
        submissionRepository.save(submission);

        return buildResponse(
            true,
            MailCodes.OK,
            "DONE",
            "Both thank-you and admin emails were sent successfully.",
            submission.getRequestId(),
            false,
            consumed
        );
    }

    private void processSingleRetryTask(MailRetryTask task) {
        task.setStatus(RetryTaskStatus.RUNNING);
        retryTaskRepository.save(task);

        Optional<MailSubmission> submissionOpt = submissionRepository.findByRequestId(task.getRequestId());
        if (submissionOpt.isEmpty()) {
            task.setStatus(RetryTaskStatus.DEAD);
            task.setLastError("Submission not found.");
            retryTaskRepository.save(task);
            return;
        }

        MailSubmission submission = submissionOpt.get();
        if (submission.getStatus() == SubmissionStatus.DONE || submission.getAdminMailStatus() == DeliveryStatus.SENT) {
            task.setStatus(RetryTaskStatus.DONE);
            task.setLastError(null);
            retryTaskRepository.save(task);
            return;
        }

        MailContent retryMail = buildAdminMailForRetry(submission);
        MailSendResult sendResult = smtpMailService.sendHtml(properties.getTargetEmail(), retryMail);

        if (sendResult.isOk()) {
            submission.setStatus(SubmissionStatus.DONE);
            submission.setAdminMailStatus(DeliveryStatus.SENT);
            submission.setLastErrorCode(null);
            submission.setLastErrorDetail(null);
            submissionRepository.save(submission);

            task.setStatus(RetryTaskStatus.DONE);
            task.setLastError(null);
            retryTaskRepository.save(task);
            return;
        }

        submission.setStatus(SubmissionStatus.PARTIAL_SUCCESS);
        submission.setAdminMailStatus(DeliveryStatus.FAILED);
        submission.setLastErrorCode(MailCodes.ADMIN_MAIL_SEND_FAILED);
        submission.setLastErrorDetail(sendResult.getDetail());
        submissionRepository.save(submission);

        int nextAttemptCount = task.getAttemptCount() + 1;
        task.setAttemptCount(nextAttemptCount);
        task.setLastError(sendResult.getDetail());

        long nextDelay = getRetryDelaySeconds(nextAttemptCount);
        boolean outOfAttempts = nextAttemptCount >= Math.max(1, properties.getRetryDelaysSeconds().size());

        if (outOfAttempts) {
            task.setStatus(RetryTaskStatus.DEAD);
        } else {
            task.setStatus(RetryTaskStatus.PENDING);
            task.setNextAttemptAt(Instant.now().plusSeconds(nextDelay));
        }

        retryTaskRepository.save(task);
    }

    private void upsertRetryTask(String requestId, String errorDetail) {
        MailRetryTask task = retryTaskRepository.findFirstByRequestIdAndTaskType(requestId, RetryTaskType.ADMIN_MAIL_RETRY)
            .orElseGet(() -> {
                MailRetryTask created = new MailRetryTask();
                created.setRequestId(requestId);
                created.setTaskType(RetryTaskType.ADMIN_MAIL_RETRY);
                created.setAttemptCount(0);
                return created;
            });

        task.setStatus(RetryTaskStatus.PENDING);
        task.setLastError(errorDetail);
        task.setNextAttemptAt(Instant.now().plusSeconds(getRetryDelaySeconds(0)));
        retryTaskRepository.save(task);
    }

    private long getRetryDelaySeconds(int attemptIndex) {
        List<Long> delays = properties.getRetryDelaysSeconds();
        if (delays == null || delays.isEmpty()) {
            return 60L;
        }
        int idx = Math.max(0, Math.min(attemptIndex, delays.size() - 1));
        return Math.max(1L, delays.get(idx));
    }

    private String resolveLocale(String locale) {
        if (locale == null || locale.isBlank()) {
            return properties.getDefaultLocale();
        }
        String normalized = locale.trim().toLowerCase();
        return normalized.equals("zh") ? "zh" : "en";
    }

    private String resolveRequestId(String incomingRequestId) {
        if (incomingRequestId == null || incomingRequestId.isBlank()) {
            return UUID.randomUUID().toString();
        }
        return incomingRequestId.trim();
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, MailCodes.INTERNAL_ERROR, "Failed to serialize request payload.");
        }
    }

    private MailSubmitResponse toIdempotentResponse(MailSubmission existing) {
        MailQuotaSnapshot snapshot = quotaService.currentSnapshot(existing.getUserEmail());

        return switch (existing.getStatus()) {
            case DONE -> buildResponse(true, MailCodes.OK, "DONE", "Request already processed successfully.", existing.getRequestId(), false, snapshot);
            case PARTIAL_SUCCESS -> buildResponse(true, MailCodes.PARTIAL_SUCCESS_ADMIN_RETRYING, "PARTIAL_SUCCESS", "Request already accepted. Admin mail is pending retry.", existing.getRequestId(), true, snapshot);
            case USER_MAIL_SENT, PENDING -> buildResponse(true, "IN_PROGRESS", existing.getStatus().name(), "Request is being processed.", existing.getRequestId(), false, snapshot);
            case FAILED -> buildResponse(false,
                existing.getLastErrorCode() == null ? MailCodes.INTERNAL_ERROR : existing.getLastErrorCode(),
                "FAILED",
                existing.getLastErrorDetail() == null ? "Previous request failed." : existing.getLastErrorDetail(),
                existing.getRequestId(),
                false,
                snapshot);
        };
    }

    private MailSubmitResponse buildResponse(
        boolean ok,
        String code,
        String state,
        String message,
        String requestId,
        boolean retryScheduled,
        MailQuotaSnapshot quotaSnapshot
    ) {
        MailSubmitResponse response = new MailSubmitResponse();
        response.setOk(ok);
        response.setCode(code);
        response.setState(state);
        response.setMessage(message);
        response.setRequestId(requestId);
        response.setRetryScheduled(retryScheduled);
        response.setQuota(quotaSnapshot);
        return response;
    }

    private MailContent buildAdminMailForRetry(MailSubmission submission) {
        String fallbackSubject = submission.getAdminMailSubject();
        String fallbackHtml = submission.getAdminMailHtml();
        String retryOrigin = "backend-retry";

        try {
            if (submission.getSubmitType() == SubmissionType.DATASET) {
                DatasetSubmissionRequest request = objectMapper.readValue(submission.getPayloadJson(), DatasetSubmissionRequest.class);
                return templateService.buildAdminDatasetMail(request, submission.getRequestId(), retryOrigin);
            }
            if (submission.getSubmitType() == SubmissionType.CONTACT) {
                ContactSubmissionRequest request = objectMapper.readValue(submission.getPayloadJson(), ContactSubmissionRequest.class);
                return templateService.buildAdminContactMail(request, submission.getRequestId(), retryOrigin);
            }
        } catch (JsonProcessingException ex) {
            log.warn("Failed to rebuild admin mail from payload for requestId={}: {}", submission.getRequestId(), ex.getMessage());
        }

        return new MailContent(fallbackSubject, fallbackHtml);
    }
}
