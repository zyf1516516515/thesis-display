package com.thesisdisplay.backend.dto;

public class MailSendResult {

    private final boolean ok;
    private final String code;
    private final String detail;

    private MailSendResult(boolean ok, String code, String detail) {
        this.ok = ok;
        this.code = code;
        this.detail = detail;
    }

    public static MailSendResult ok() {
        return new MailSendResult(true, null, null);
    }

    public static MailSendResult failed(String code, String detail) {
        return new MailSendResult(false, code, detail);
    }

    public boolean isOk() {
        return ok;
    }

    public String getCode() {
        return code;
    }

    public String getDetail() {
        return detail;
    }
}
