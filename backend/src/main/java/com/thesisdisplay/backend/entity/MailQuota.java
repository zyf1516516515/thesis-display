package com.thesisdisplay.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "mail_quota")
public class MailQuota {

    @Id
    @Column(name = "user_email", nullable = false, length = 320)
    private String userEmail;

    @Column(name = "day_key", nullable = false, length = 10)
    private String dayKey;

    @Column(name = "day_count", nullable = false)
    private int dayCount;

    @Column(name = "month_key", nullable = false, length = 7)
    private String monthKey;

    @Column(name = "month_count", nullable = false)
    private int monthCount;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    public void onSave() {
        this.updatedAt = Instant.now();
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getDayKey() {
        return dayKey;
    }

    public void setDayKey(String dayKey) {
        this.dayKey = dayKey;
    }

    public int getDayCount() {
        return dayCount;
    }

    public void setDayCount(int dayCount) {
        this.dayCount = dayCount;
    }

    public String getMonthKey() {
        return monthKey;
    }

    public void setMonthKey(String monthKey) {
        this.monthKey = monthKey;
    }

    public int getMonthCount() {
        return monthCount;
    }

    public void setMonthCount(int monthCount) {
        this.monthCount = monthCount;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
