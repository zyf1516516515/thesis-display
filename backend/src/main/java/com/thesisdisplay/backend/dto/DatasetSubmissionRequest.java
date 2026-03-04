package com.thesisdisplay.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
public class DatasetSubmissionRequest {

    @Size(max = 64)
    private String requestId;

    @NotBlank
    @Email
    @Size(max = 320)
    private String userEmail;

    @Size(max = 8)
    private String locale;

    @NotBlank
    @Size(max = 200)
    private String datasetName;

    @Size(max = 2000)
    private String shortDescription;

    @Size(max = 200)
    private String dataFormatScale;

    @Size(max = 500)
    private String cloudStorageLink1;

    @Size(max = 500)
    private String cloudStorageLink2;

    @Size(max = 200)
    private String usageLicense;

    @Size(max = 2000)
    private String citationMethod;

    @Size(max = 260)
    private String coverImageName;

    @Size(max = 100000)
    private String coverImageDataUrl;

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
    }

    public String getDatasetName() {
        return datasetName;
    }

    public void setDatasetName(String datasetName) {
        this.datasetName = datasetName;
    }

    public String getShortDescription() {
        return shortDescription;
    }

    public void setShortDescription(String shortDescription) {
        this.shortDescription = shortDescription;
    }

    public String getDataFormatScale() {
        return dataFormatScale;
    }

    public void setDataFormatScale(String dataFormatScale) {
        this.dataFormatScale = dataFormatScale;
    }

    public String getCloudStorageLink1() {
        return cloudStorageLink1;
    }

    public void setCloudStorageLink1(String cloudStorageLink1) {
        this.cloudStorageLink1 = cloudStorageLink1;
    }

    public String getCloudStorageLink2() {
        return cloudStorageLink2;
    }

    public void setCloudStorageLink2(String cloudStorageLink2) {
        this.cloudStorageLink2 = cloudStorageLink2;
    }

    public String getUsageLicense() {
        return usageLicense;
    }

    public void setUsageLicense(String usageLicense) {
        this.usageLicense = usageLicense;
    }

    public String getCitationMethod() {
        return citationMethod;
    }

    public void setCitationMethod(String citationMethod) {
        this.citationMethod = citationMethod;
    }

    public String getCoverImageName() {
        return coverImageName;
    }

    public void setCoverImageName(String coverImageName) {
        this.coverImageName = coverImageName;
    }

    public String getCoverImageDataUrl() {
        return coverImageDataUrl;
    }

    public void setCoverImageDataUrl(String coverImageDataUrl) {
        this.coverImageDataUrl = coverImageDataUrl;
    }
}
