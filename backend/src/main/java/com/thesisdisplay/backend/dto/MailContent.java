package com.thesisdisplay.backend.dto;

import java.util.List;

public class MailContent {

    private final String subject;
    private final String html;
    private final List<MailInlineResource> inlineResources;

    public MailContent(String subject, String html) {
        this(subject, html, List.of());
    }

    public MailContent(String subject, String html, List<MailInlineResource> inlineResources) {
        this.subject = subject;
        this.html = html;
        this.inlineResources = inlineResources == null ? List.of() : List.copyOf(inlineResources);
    }

    public String getSubject() {
        return subject;
    }

    public String getHtml() {
        return html;
    }

    public List<MailInlineResource> getInlineResources() {
        return inlineResources;
    }
}
