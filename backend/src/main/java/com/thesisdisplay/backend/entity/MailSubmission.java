package com.thesisdisplay.backend.entity;

import com.thesisdisplay.backend.enums.DeliveryStatus;
import com.thesisdisplay.backend.enums.SubmissionStatus;
import com.thesisdisplay.backend.enums.SubmissionType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "mail_submission")
public class MailSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id", nullable = false, unique = true, length = 64)
    private String requestId;

    @Enumerated(EnumType.STRING)
    @Column(name = "submit_type", nullable = false, length = 16)
    private SubmissionType submitType;

    @Column(name = "user_email", nullable = false, length = 320)
    private String userEmail;

    @Column(name = "locale", nullable = false, length = 8)
    private String locale;

    @Lob
    @Column(name = "payload_json", nullable = false, columnDefinition = "LONGTEXT")
    private String payloadJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private SubmissionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_mail_status", nullable = false, length = 16)
    private DeliveryStatus userMailStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "admin_mail_status", nullable = false, length = 16)
    private DeliveryStatus adminMailStatus;

    @Column(name = "user_mail_subject", length = 512)
    private String userMailSubject;

    @Column(name = "admin_mail_subject", length = 512)
    private String adminMailSubject;

    @Lob
    @Column(name = "admin_mail_html", columnDefinition = "LONGTEXT")
    private String adminMailHtml;

    @Column(name = "last_error_code", length = 64)
    private String lastErrorCode;

    @Column(name = "last_error_detail", length = 1024)
    private String lastErrorDetail;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public SubmissionType getSubmitType() {
        return submitType;
    }

    public void setSubmitType(SubmissionType submitType) {
        this.submitType = submitType;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
    }

    public String getPayloadJson() {
        return payloadJson;
    }

    public void setPayloadJson(String payloadJson) {
        this.payloadJson = payloadJson;
    }

    public SubmissionStatus getStatus() {
        return status;
    }

    public void setStatus(SubmissionStatus status) {
        this.status = status;
    }

    public DeliveryStatus getUserMailStatus() {
        return userMailStatus;
    }

    public void setUserMailStatus(DeliveryStatus userMailStatus) {
        this.userMailStatus = userMailStatus;
    }

    public DeliveryStatus getAdminMailStatus() {
        return adminMailStatus;
    }

    public void setAdminMailStatus(DeliveryStatus adminMailStatus) {
        this.adminMailStatus = adminMailStatus;
    }

    public String getUserMailSubject() {
        return userMailSubject;
    }

    public void setUserMailSubject(String userMailSubject) {
        this.userMailSubject = userMailSubject;
    }

    public String getAdminMailSubject() {
        return adminMailSubject;
    }

    public void setAdminMailSubject(String adminMailSubject) {
        this.adminMailSubject = adminMailSubject;
    }

    public String getAdminMailHtml() {
        return adminMailHtml;
    }

    public void setAdminMailHtml(String adminMailHtml) {
        this.adminMailHtml = adminMailHtml;
    }

    public String getLastErrorCode() {
        return lastErrorCode;
    }

    public void setLastErrorCode(String lastErrorCode) {
        this.lastErrorCode = lastErrorCode;
    }

    public String getLastErrorDetail() {
        return lastErrorDetail;
    }

    public void setLastErrorDetail(String lastErrorDetail) {
        this.lastErrorDetail = lastErrorDetail;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
