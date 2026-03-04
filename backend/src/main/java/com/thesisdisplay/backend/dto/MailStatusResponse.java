package com.thesisdisplay.backend.dto;

public class MailStatusResponse {

    private String requestId;
    private String status;
    private String userMailStatus;
    private String adminMailStatus;
    private String lastErrorCode;
    private String lastErrorDetail;

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getUserMailStatus() {
        return userMailStatus;
    }

    public void setUserMailStatus(String userMailStatus) {
        this.userMailStatus = userMailStatus;
    }

    public String getAdminMailStatus() {
        return adminMailStatus;
    }

    public void setAdminMailStatus(String adminMailStatus) {
        this.adminMailStatus = adminMailStatus;
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
}
