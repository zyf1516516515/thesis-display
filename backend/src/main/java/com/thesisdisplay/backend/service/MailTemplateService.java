package com.thesisdisplay.backend.service;

import com.thesisdisplay.backend.config.MailServiceProperties;
import com.thesisdisplay.backend.dto.ContactSubmissionRequest;
import com.thesisdisplay.backend.dto.DatasetSubmissionRequest;
import com.thesisdisplay.backend.dto.MailContent;
import com.thesisdisplay.backend.dto.MailInlineResource;
import com.thesisdisplay.backend.util.HtmlEscape;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class MailTemplateService {

    private static final DateTimeFormatter TS_FMT = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
    private static final String COVER_INLINE_CID = "dataset-cover-image";
    private static final int MAX_INLINE_IMAGE_BYTES = 2 * 1024 * 1024;
    private final MailServiceProperties properties;

    public MailTemplateService(MailServiceProperties properties) {
        this.properties = properties;
    }

    public MailContent buildUserContactThankYou(ContactSubmissionRequest request, String requestId, String origin) {
        String locale = localeOrDefault(request.getLocale());
        String subject = "[Focus Framework] Contact submission received";

        Map<String, String> rows = new LinkedHashMap<>();
        rows.put("Request ID", requestId);
        rows.put("User Email", request.getUserEmail());
        rows.put("Locale", locale);
        rows.put("Subject", request.getSubject());
        rows.put("Content", request.getContent());
        rows.put("Source", origin);
        rows.put("Submitted At (UTC)", TS_FMT.format(Instant.now().atOffset(ZoneOffset.UTC)));

        String body = """
            <h2 class=\"section-title\">Thank you for your contact submission</h2>
            <p class=\"section-desc\">Your message has been received successfully. Please keep the summary below for your records.</p>
            %s
            """.formatted(renderRowsTable(rows));

        return new MailContent(subject, wrapHtml("Contact Submission Receipt", locale, body));
    }

    public MailContent buildUserDatasetThankYou(DatasetSubmissionRequest request, String requestId, String origin) {
        String locale = localeOrDefault(request.getLocale());
        String subject = "[Focus Framework] Dataset submission received";

        CoverRenderContext cover = buildCoverRenderContext(request.getCoverImageDataUrl(), request.getCoverImageName());
        Map<String, String> rows = buildDatasetRows(request, requestId, origin, cover.summary);
        String coverPreview = renderCoverPreview(cover.inlineReady, request.getCoverImageName());

        String body = """
            <h2 class=\"section-title\">Thank you for your dataset submission</h2>
            <p class=\"section-desc\">Your dataset form has been received. The submitted fields are listed below.</p>
            %s
            %s
            """.formatted(renderRowsTable(rows), coverPreview);

        return new MailContent(subject, wrapHtml("Dataset Submission Receipt", locale, body), cover.inlineResources);
    }

    public MailContent buildAdminContactMail(ContactSubmissionRequest request, String requestId, String origin) {
        String locale = localeOrDefault(request.getLocale());
        String subject = "[Focus Framework] Contact submission: " + trimOrFallback(request.getSubject(), "Untitled");

        Map<String, String> rows = new LinkedHashMap<>();
        rows.put("Request ID", requestId);
        rows.put("User Email", request.getUserEmail());
        rows.put("Locale", locale);
        rows.put("Subject", request.getSubject());
        rows.put("Content", request.getContent());
        rows.put("Source", origin);
        rows.put("Submitted At (UTC)", TS_FMT.format(Instant.now().atOffset(ZoneOffset.UTC)));

        String body = """
            <h2 class=\"section-title\">Admin notification: Contact submission</h2>
            <p class=\"section-desc\">All submitted form fields are included below.</p>
            %s
            """.formatted(renderRowsTable(rows));

        return new MailContent(subject, wrapHtml("Contact Submission (Admin)", locale, body));
    }

    public MailContent buildAdminDatasetMail(DatasetSubmissionRequest request, String requestId, String origin) {
        String locale = localeOrDefault(request.getLocale());
        String subject = "[Focus Framework] Dataset submission: " + trimOrFallback(request.getDatasetName(), "Untitled");

        CoverRenderContext cover = buildCoverRenderContext(request.getCoverImageDataUrl(), request.getCoverImageName());
        Map<String, String> rows = buildDatasetRows(request, requestId, origin, cover.summary);
        String coverPreview = renderCoverPreview(cover.inlineReady, request.getCoverImageName());

        String body = """
            <h2 class=\"section-title\">Admin notification: Dataset submission</h2>
            <p class=\"section-desc\">All submitted form fields are included below.</p>
            %s
            %s
            """.formatted(renderRowsTable(rows), coverPreview);

        return new MailContent(subject, wrapHtml("Dataset Submission (Admin)", locale, body), cover.inlineResources);
    }

    private Map<String, String> buildDatasetRows(
        DatasetSubmissionRequest request,
        String requestId,
        String origin,
        String coverDeliverySummary
    ) {
        Map<String, String> rows = new LinkedHashMap<>();
        rows.put("Request ID", requestId);
        rows.put("User Email", request.getUserEmail());
        rows.put("Locale", localeOrDefault(request.getLocale()));
        rows.put("Dataset Name", request.getDatasetName());
        rows.put("Short Description", request.getShortDescription());
        rows.put("Data Format & Scale", request.getDataFormatScale());
        rows.put("Cloud Storage Link #1", request.getCloudStorageLink1());
        rows.put("Cloud Storage Link #2", request.getCloudStorageLink2());
        rows.put("Usage License", request.getUsageLicense());
        rows.put("Citation Method", request.getCitationMethod());
        rows.put("Cover Image Name", request.getCoverImageName());
        rows.put("Cover Image Delivery", coverDeliverySummary);
        rows.put("Source", origin);
        rows.put("Submitted At (UTC)", TS_FMT.format(Instant.now().atOffset(ZoneOffset.UTC)));
        return rows;
    }

    private CoverRenderContext buildCoverRenderContext(String coverImageDataUrl, String coverImageName) {
        String safeName = trimOrFallback(coverImageName, "cover-image");
        InlineImagePayload payload = parseInlineDataImage(coverImageDataUrl, safeName);
        if (payload == null) {
            return new CoverRenderContext(
                false,
                "Inline image unavailable (invalid or unsupported image data).",
                List.of()
            );
        }

        MailInlineResource inline = new MailInlineResource(
            COVER_INLINE_CID,
            payload.fileName,
            payload.contentType,
            payload.bytes
        );

        String summary = "Embedded inline image (CID), " + payload.contentType + ", "
            + payload.bytes.length + " bytes";

        return new CoverRenderContext(true, summary, List.of(inline));
    }

    private InlineImagePayload parseInlineDataImage(String dataUrl, String fileName) {
        if (dataUrl == null || dataUrl.isBlank()) {
            return null;
        }

        String value = dataUrl.trim();
        if (!value.startsWith("data:image/")) {
            return null;
        }

        int commaIndex = value.indexOf(',');
        if (commaIndex <= 0) {
            return null;
        }

        String metadata = value.substring(5, commaIndex); // image/png;base64
        int semicolonIndex = metadata.indexOf(';');
        if (semicolonIndex <= 0) {
            return null;
        }

        String contentType = metadata.substring(0, semicolonIndex).toLowerCase(Locale.ROOT);
        if (!metadata.substring(semicolonIndex + 1).contains("base64")) {
            return null;
        }

        String base64 = value.substring(commaIndex + 1).replaceAll("\\s+", "");
        if (base64.isBlank()) {
            return null;
        }

        byte[] decoded;
        try {
            decoded = Base64.getDecoder().decode(base64);
        } catch (IllegalArgumentException ex) {
            return null;
        }

        if (decoded.length == 0 || decoded.length > MAX_INLINE_IMAGE_BYTES) {
            return null;
        }

        return new InlineImagePayload(contentType, normalizeFileName(fileName, contentType), decoded);
    }

    private String normalizeFileName(String fileName, String contentType) {
        String trimmed = trimOrFallback(fileName, "cover-image");
        String sanitized = trimmed.replaceAll("[^A-Za-z0-9._-]", "_");
        if (sanitized.isBlank()) {
            sanitized = "cover-image";
        }

        if (sanitized.contains(".")) {
            return sanitized;
        }

        return sanitized + resolveDefaultExtension(contentType);
    }

    private String resolveDefaultExtension(String contentType) {
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/gif" -> ".gif";
            case "image/webp" -> ".webp";
            case "image/bmp" -> ".bmp";
            case "image/tiff" -> ".tif";
            case "image/svg+xml" -> ".svg";
            default -> ".jpg";
        };
    }

    private String localeOrDefault(String locale) {
        String raw = locale == null ? "" : locale.trim();
        if (!raw.isBlank()) {
            return raw;
        }
        String configured = properties.getDefaultLocale();
        return configured == null || configured.isBlank() ? "en" : configured.trim();
    }

    private String trimOrFallback(String value, String fallback) {
        String trimmed = value == null ? "" : value.trim();
        return trimmed.isEmpty() ? fallback : trimmed;
    }

    private String renderRowsTable(Map<String, String> rows) {
        StringBuilder sb = new StringBuilder();
        sb.append("<table class=\"info-table\" role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">");

        for (Map.Entry<String, String> entry : rows.entrySet()) {
            sb.append("<tr>")
                .append("<th>")
                .append(HtmlEscape.escape(entry.getKey()))
                .append("</th>")
                .append("<td>")
                .append(HtmlEscape.escape(trimOrFallback(entry.getValue(), "-")))
                .append("</td>")
                .append("</tr>");
        }

        sb.append("</table>");
        return sb.toString();
    }

    private String renderCoverPreview(boolean inlineReady, String coverImageName) {
        if (!inlineReady) {
            return """
                <div class=\"cover-wrap\">
                  <p class=\"cover-title\">Cover Image Preview</p>
                  <p class=\"cover-empty\">Preview unavailable. The uploaded image data is invalid or not supported.</p>
                </div>
                """;
        }

        String alt = trimOrFallback(coverImageName, "cover-image");
        return """
            <div class=\"cover-wrap\">
              <p class=\"cover-title\">Cover Image Preview</p>
              <img class=\"cover-image\" src=\"cid:%s\" alt=\"%s\" />
            </div>
            """.formatted(COVER_INLINE_CID, HtmlEscape.escape(alt));
    }

    private String wrapHtml(String title, String locale, String bodyHtml) {
        return """
            <!doctype html>
            <html lang=\"%s\">
            <head>
              <meta charset=\"utf-8\" />
              <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />
              <title>%s</title>
              <style>
                body{margin:0;padding:0;background:#eef4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1a2e4f;}
                .shell{width:100%%;padding:22px 0;background:#eef4ff;}
                .container{max-width:780px;width:100%%;margin:0 auto;}
                .card{background:#fff;border:1px solid #d4deef;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(18,45,89,.12);}
                .head{padding:24px 24px;background:linear-gradient(135deg,#e4efff,#f7fbff);border-bottom:1px solid #d4deef;text-align:center;}
                .title{margin:0;font-size:24px;line-height:1.35;color:#1f4f8f;font-weight:800;letter-spacing:.2px;}
                .body{padding:22px 24px 24px;}
                .section-title{margin:0 0 9px;font-size:20px;line-height:1.35;color:#234f8d;font-weight:800;text-align:center;}
                .section-desc{margin:0 auto 14px;font-size:15px;line-height:1.65;color:#2e4a73;text-align:center;max-width:680px;}
                .info-table{width:100%%;border-collapse:collapse;table-layout:fixed;margin:0 auto 14px;}
                .info-table th,.info-table td{border:1px solid #d4deef;padding:11px 12px;vertical-align:top;font-size:14px;line-height:1.6;word-break:break-word;}
                .info-table th{width:34%%;background:#f4f8ff;color:#294a77;font-weight:700;text-align:left;}
                .cover-wrap{margin:12px auto 10px;padding:14px;border:1px dashed #b8c9e6;border-radius:12px;background:#f8fbff;text-align:center;}
                .cover-title{margin:0 0 10px;font-size:14px;line-height:1.45;color:#2b4d78;font-weight:700;}
                .cover-empty{margin:0;font-size:13px;color:#4a6489;line-height:1.55;}
                .cover-image{display:block;width:auto;max-width:min(100%%,640px);max-height:420px;height:auto;margin:0 auto;border:1px solid #d4deef;border-radius:10px;background:#fff;object-fit:contain;}
                @media only screen and (max-width:600px){
                  .container{width:100%% !important;}
                  .head{padding:18px 14px !important;}
                  .body{padding:14px !important;}
                  .title{font-size:20px !important;}
                  .section-title{font-size:18px !important;}
                  .section-desc{font-size:14px !important;}
                  .info-table th,.info-table td{display:block;width:100%% !important;box-sizing:border-box;padding:10px 10px !important;font-size:13px !important;}
                  .info-table th{border-bottom:none;}
                  .cover-image{max-height:320px !important;}
                }
              </style>
            </head>
            <body>
              <table class=\"shell\" role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">
                <tr>
                  <td align=\"center\">
                    <table class=\"container\" role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">
                      <tr>
                        <td class=\"card\">
                          <div class=\"head\"><h1 class=\"title\">%s</h1></div>
                          <div class=\"body\">%s</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(
            HtmlEscape.escape(locale),
            HtmlEscape.escape(title),
            HtmlEscape.escape(title),
            bodyHtml
        );
    }

    private static class InlineImagePayload {
        private final String contentType;
        private final String fileName;
        private final byte[] bytes;

        private InlineImagePayload(String contentType, String fileName, byte[] bytes) {
            this.contentType = contentType;
            this.fileName = fileName;
            this.bytes = bytes;
        }
    }

    private static class CoverRenderContext {
        private final boolean inlineReady;
        private final String summary;
        private final List<MailInlineResource> inlineResources;

        private CoverRenderContext(boolean inlineReady, String summary, List<MailInlineResource> inlineResources) {
            this.inlineReady = inlineReady;
            this.summary = summary;
            this.inlineResources = inlineResources;
        }
    }
}
