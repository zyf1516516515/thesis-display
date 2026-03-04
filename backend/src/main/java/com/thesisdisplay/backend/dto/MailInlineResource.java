package com.thesisdisplay.backend.dto;

public class MailInlineResource {

    private final String contentId;
    private final String fileName;
    private final String contentType;
    private final byte[] bytes;

    public MailInlineResource(String contentId, String fileName, String contentType, byte[] bytes) {
        this.contentId = contentId;
        this.fileName = fileName;
        this.contentType = contentType;
        this.bytes = bytes == null ? new byte[0] : bytes.clone();
    }

    public String getContentId() {
        return contentId;
    }

    public String getFileName() {
        return fileName;
    }

    public String getContentType() {
        return contentType;
    }

    public byte[] getBytes() {
        return bytes.clone();
    }
}
