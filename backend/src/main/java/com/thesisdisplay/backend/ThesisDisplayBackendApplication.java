package com.thesisdisplay.backend;

import com.thesisdisplay.backend.config.MailServiceProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(MailServiceProperties.class)
public class ThesisDisplayBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ThesisDisplayBackendApplication.class, args);
    }
}
