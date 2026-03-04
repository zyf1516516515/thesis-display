package com.thesisdisplay.backend.dto;

public class MailSubmitResponse {

    private boolean ok;
    private String code;
    private String state;
    private String message;
    private String requestId;
    private boolean retryScheduled;
    private MailQuotaSnapshot quota;

    public boolean isOk() {
        return ok;
    }

    public void setOk(boolean ok) {
        this.ok = ok;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public boolean isRetryScheduled() {
        return retryScheduled;
    }

    public void setRetryScheduled(boolean retryScheduled) {
        this.retryScheduled = retryScheduled;
    }

    public MailQuotaSnapshot getQuota() {
        return quota;
    }

    public void setQuota(MailQuotaSnapshot quota) {
        this.quota = quota;
    }
}
