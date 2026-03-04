package com.thesisdisplay.backend.repo;

import com.thesisdisplay.backend.entity.MailRetryTask;
import com.thesisdisplay.backend.enums.RetryTaskStatus;
import com.thesisdisplay.backend.enums.RetryTaskType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface MailRetryTaskRepository extends JpaRepository<MailRetryTask, Long> {
    Optional<MailRetryTask> findFirstByRequestIdAndTaskType(String requestId, RetryTaskType taskType);

    List<MailRetryTask> findTop50ByStatusAndNextAttemptAtLessThanEqualOrderByNextAttemptAtAsc(
        RetryTaskStatus status,
        Instant now
    );
}
