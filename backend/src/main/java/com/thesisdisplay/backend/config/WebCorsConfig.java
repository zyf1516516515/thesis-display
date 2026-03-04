package com.thesisdisplay.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebCorsConfig implements WebMvcConfigurer {

    private final MailServiceProperties properties;

    public WebCorsConfig(MailServiceProperties properties) {
        this.properties = properties;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(properties.getAllowedOrigins().toArray(new String[0]))
            .allowedMethods("GET", "POST", "OPTIONS")
            .allowedHeaders("Content-Type", "X-Request-ID")
            .exposedHeaders("X-Request-ID")
            .allowCredentials(false)
            .maxAge(3600);
    }
}
