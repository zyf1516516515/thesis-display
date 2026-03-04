package com.thesisdisplay.backend.controller;

import com.thesisdisplay.backend.dto.ContactSubmissionRequest;
import com.thesisdisplay.backend.dto.DatasetSubmissionRequest;
import com.thesisdisplay.backend.dto.MailStatusResponse;
import com.thesisdisplay.backend.dto.MailSubmitResponse;
import com.thesisdisplay.backend.service.MailSubmissionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mail")
public class MailController {

    private final MailSubmissionService mailSubmissionService;

    public MailController(MailSubmissionService mailSubmissionService) {
        this.mailSubmissionService = mailSubmissionService;
    }

    @PostMapping("/contact")
    public ResponseEntity<MailSubmitResponse> submitContact(
        @Valid @RequestBody ContactSubmissionRequest request,
        HttpServletRequest servletRequest
    ) {
        String origin = normalizeOrigin(servletRequest);
        MailSubmitResponse response = mailSubmissionService.submitContact(request, origin);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/dataset")
    public ResponseEntity<MailSubmitResponse> submitDataset(
        @Valid @RequestBody DatasetSubmissionRequest request,
        HttpServletRequest servletRequest
    ) {
        String origin = normalizeOrigin(servletRequest);
        MailSubmitResponse response = mailSubmissionService.submitDataset(request, origin);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status/{requestId}")
    public ResponseEntity<MailStatusResponse> getStatus(@PathVariable String requestId) {
        return ResponseEntity.ok(mailSubmissionService.getStatus(requestId));
    }

    private String normalizeOrigin(HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        if (origin != null && !origin.isBlank()) {
            return origin.trim();
        }
        String fallback = request.getRemoteAddr();
        return fallback == null ? "unknown" : fallback;
    }
}
