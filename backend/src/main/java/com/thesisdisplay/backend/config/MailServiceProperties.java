package com.thesisdisplay.backend.config;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

@Validated
@ConfigurationProperties(prefix = "app.mail")
public class MailServiceProperties {

    @NotBlank
    @Email
    private String senderEmail;

    @NotBlank
    @Email
    private String targetEmail;

    @NotBlank
    private String defaultLocale = "en";

    @NotBlank
    private String zoneId = "UTC";

    @Min(1)
    private int dailyLimit = 5;

    @Min(1)
    private int monthlyLimit = 10;

    private List<String> allowedOrigins = new ArrayList<>(List.of(
        "https://zyf1516516515.github.io",
        "http://localhost:5173"
    ));

    private List<Long> retryDelaysSeconds = new ArrayList<>(List.of(60L, 300L, 900L, 3600L, 21600L));

    @Min(1)
    private int retryBatchSize = 20;

    @Min(1000)
    private long retryPollIntervalMs = 30000;

    public String getSenderEmail() {
        return senderEmail;
    }

    public void setSenderEmail(String senderEmail) {
        this.senderEmail = senderEmail;
    }

    public String getTargetEmail() {
        return targetEmail;
    }

    public void setTargetEmail(String targetEmail) {
        this.targetEmail = targetEmail;
    }

    public String getDefaultLocale() {
        return defaultLocale;
    }

    public void setDefaultLocale(String defaultLocale) {
        this.defaultLocale = defaultLocale;
    }

    public String getZoneId() {
        return zoneId;
    }

    public void setZoneId(String zoneId) {
        this.zoneId = zoneId;
    }

    public int getDailyLimit() {
        return dailyLimit;
    }

    public void setDailyLimit(int dailyLimit) {
        this.dailyLimit = dailyLimit;
    }

    public int getMonthlyLimit() {
        return monthlyLimit;
    }

    public void setMonthlyLimit(int monthlyLimit) {
        this.monthlyLimit = monthlyLimit;
    }

    public List<String> getAllowedOrigins() {
        return allowedOrigins;
    }

    public void setAllowedOrigins(List<String> allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    public List<Long> getRetryDelaysSeconds() {
        return retryDelaysSeconds;
    }

    public void setRetryDelaysSeconds(List<Long> retryDelaysSeconds) {
        this.retryDelaysSeconds = retryDelaysSeconds;
    }

    public int getRetryBatchSize() {
        return retryBatchSize;
    }

    public void setRetryBatchSize(int retryBatchSize) {
        this.retryBatchSize = retryBatchSize;
    }

    public long getRetryPollIntervalMs() {
        return retryPollIntervalMs;
    }

    public void setRetryPollIntervalMs(long retryPollIntervalMs) {
        this.retryPollIntervalMs = retryPollIntervalMs;
    }
}
