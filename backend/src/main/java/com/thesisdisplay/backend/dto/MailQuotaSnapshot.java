package com.thesisdisplay.backend.dto;

import java.time.Instant;

public class MailQuotaSnapshot {

    private int dailyUsed;
    private int dailyLimit;
    private int monthlyUsed;
    private int monthlyLimit;
    private Instant nextDailyResetAt;
    private Instant nextMonthlyResetAt;

    public int getDailyUsed() {
        return dailyUsed;
    }

    public void setDailyUsed(int dailyUsed) {
        this.dailyUsed = dailyUsed;
    }

    public int getDailyLimit() {
        return dailyLimit;
    }

    public void setDailyLimit(int dailyLimit) {
        this.dailyLimit = dailyLimit;
    }

    public int getMonthlyUsed() {
        return monthlyUsed;
    }

    public void setMonthlyUsed(int monthlyUsed) {
        this.monthlyUsed = monthlyUsed;
    }

    public int getMonthlyLimit() {
        return monthlyLimit;
    }

    public void setMonthlyLimit(int monthlyLimit) {
        this.monthlyLimit = monthlyLimit;
    }

    public Instant getNextDailyResetAt() {
        return nextDailyResetAt;
    }

    public void setNextDailyResetAt(Instant nextDailyResetAt) {
        this.nextDailyResetAt = nextDailyResetAt;
    }

    public Instant getNextMonthlyResetAt() {
        return nextMonthlyResetAt;
    }

    public void setNextMonthlyResetAt(Instant nextMonthlyResetAt) {
        this.nextMonthlyResetAt = nextMonthlyResetAt;
    }
}
