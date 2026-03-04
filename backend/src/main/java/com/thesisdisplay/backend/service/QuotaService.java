package com.thesisdisplay.backend.service;

import com.thesisdisplay.backend.config.MailServiceProperties;
import com.thesisdisplay.backend.dto.MailQuotaSnapshot;
import com.thesisdisplay.backend.entity.MailQuota;
import com.thesisdisplay.backend.repo.MailQuotaRepository;
import com.thesisdisplay.backend.util.EmailUtil;
import com.thesisdisplay.backend.util.MailCodes;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class QuotaService {

    private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

    private final MailQuotaRepository quotaRepository;
    private final MailServiceProperties properties;
    private final Clock clock;

    public QuotaService(MailQuotaRepository quotaRepository, MailServiceProperties properties, Clock appClock) {
        this.quotaRepository = quotaRepository;
        this.properties = properties;
        this.clock = appClock;
    }

    @Transactional
    public QuotaDecision checkQuota(String email) {
        MailQuota quota = touchQuota(email);
        MailQuotaSnapshot snapshot = toSnapshot(quota);

        if (quota.getDayCount() >= properties.getDailyLimit()) {
            return QuotaDecision.blocked(MailCodes.RATE_LIMIT_DAILY, "Daily quota exceeded.", snapshot);
        }
        if (quota.getMonthCount() >= properties.getMonthlyLimit()) {
            return QuotaDecision.blocked(MailCodes.RATE_LIMIT_MONTHLY, "Monthly quota exceeded.", snapshot);
        }

        return QuotaDecision.allowed(snapshot);
    }

    @Transactional
    public MailQuotaSnapshot consumeQuota(String email) {
        MailQuota quota = touchQuota(email);
        quota.setDayCount(quota.getDayCount() + 1);
        quota.setMonthCount(quota.getMonthCount() + 1);
        quotaRepository.save(quota);
        return toSnapshot(quota);
    }

    @Transactional(readOnly = true)
    public MailQuotaSnapshot currentSnapshot(String email) {
        String normalized = EmailUtil.normalize(email);
        return quotaRepository.findById(normalized)
            .map(this::snapshotWithFutureReset)
            .orElseGet(() -> {
                MailQuota empty = new MailQuota();
                empty.setUserEmail(normalized);
                ZonedDateTime now = now();
                empty.setDayKey(DAY_FMT.format(now));
                empty.setMonthKey(MONTH_FMT.format(now));
                empty.setDayCount(0);
                empty.setMonthCount(0);
                return toSnapshot(empty);
            });
    }

    private MailQuota touchQuota(String email) {
        String normalized = EmailUtil.normalize(email);
        ZonedDateTime now = now();
        String dayKey = DAY_FMT.format(now);
        String monthKey = MONTH_FMT.format(now);

        MailQuota quota = quotaRepository.findById(normalized).orElseGet(() -> {
            MailQuota created = new MailQuota();
            created.setUserEmail(normalized);
            created.setDayKey(dayKey);
            created.setMonthKey(monthKey);
            created.setDayCount(0);
            created.setMonthCount(0);
            return created;
        });

        if (!dayKey.equals(quota.getDayKey())) {
            quota.setDayKey(dayKey);
            quota.setDayCount(0);
        }
        if (!monthKey.equals(quota.getMonthKey())) {
            quota.setMonthKey(monthKey);
            quota.setMonthCount(0);
        }

        return quotaRepository.save(quota);
    }

    private ZonedDateTime now() {
        ZoneId zoneId = ZoneId.of(properties.getZoneId());
        return ZonedDateTime.ofInstant(Instant.now(clock), zoneId);
    }

    private MailQuotaSnapshot toSnapshot(MailQuota quota) {
        return snapshotWithFutureReset(quota);
    }

    private MailQuotaSnapshot snapshotWithFutureReset(MailQuota quota) {
        ZonedDateTime current = now();
        ZoneId zoneId = ZoneId.of(properties.getZoneId());

        MailQuotaSnapshot snapshot = new MailQuotaSnapshot();
        snapshot.setDailyUsed(quota.getDayCount());
        snapshot.setDailyLimit(properties.getDailyLimit());
        snapshot.setMonthlyUsed(quota.getMonthCount());
        snapshot.setMonthlyLimit(properties.getMonthlyLimit());

        ZonedDateTime nextDaily = current.toLocalDate().plusDays(1).atStartOfDay(zoneId);
        ZonedDateTime nextMonthly = current.withDayOfMonth(1).plusMonths(1).toLocalDate().atStartOfDay(zoneId);
        snapshot.setNextDailyResetAt(nextDaily.toInstant());
        snapshot.setNextMonthlyResetAt(nextMonthly.toInstant());
        return snapshot;
    }

    public record QuotaDecision(boolean allowed, String code, String message, MailQuotaSnapshot snapshot) {
        public static QuotaDecision allowed(MailQuotaSnapshot snapshot) {
            return new QuotaDecision(true, null, null, snapshot);
        }

        public static QuotaDecision blocked(String code, String message, MailQuotaSnapshot snapshot) {
            return new QuotaDecision(false, code, message, snapshot);
        }
    }
}
