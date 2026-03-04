package com.thesisdisplay.backend.service;

import com.thesisdisplay.backend.config.MailServiceProperties;
import com.thesisdisplay.backend.dto.MailContent;
import com.thesisdisplay.backend.dto.MailInlineResource;
import com.thesisdisplay.backend.dto.MailSendResult;
import com.thesisdisplay.backend.util.MailCodes;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SmtpMailService {

    private final JavaMailSender mailSender;
    private final MailServiceProperties properties;

    public SmtpMailService(JavaMailSender mailSender, MailServiceProperties properties) {
        this.mailSender = mailSender;
        this.properties = properties;
    }

    public MailSendResult sendHtml(String to, String subject, String html) {
        return sendHtml(to, new MailContent(subject, html));
    }

    public MailSendResult sendHtml(String to, MailContent content) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            List<MailInlineResource> inlineResources = content.getInlineResources();
            boolean hasInline = inlineResources != null && !inlineResources.isEmpty();

            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, hasInline, "UTF-8");
            helper.setFrom(properties.getSenderEmail());
            helper.setTo(to);
            helper.setReplyTo(properties.getSenderEmail());
            helper.setSubject(content.getSubject());
            helper.setText(content.getHtml(), true);

            if (hasInline) {
                for (MailInlineResource resource : inlineResources) {
                    if (resource == null || resource.getBytes().length == 0) {
                        continue;
                    }
                    helper.addInline(
                        resource.getContentId(),
                        new ByteArrayResource(resource.getBytes()),
                        resource.getContentType()
                    );
                }
            }

            mailSender.send(mimeMessage);
            return MailSendResult.ok();
        } catch (MailException | MessagingException ex) {
            String detail = ex.getMessage() == null ? "SMTP send failed." : ex.getMessage();
            return MailSendResult.failed(MailCodes.INTERNAL_ERROR, detail);
        }
    }
}
