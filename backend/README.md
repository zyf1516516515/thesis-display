# thesis-display backend mail service

Spring Boot backend for handling contact/dataset mail submissions.

## Features

- SMTP sending via 163 mailbox (`smtp.163.com:465`, SSL)
- CORS allowlist:
  - `https://zyf1516516515.github.io`
  - `http://localhost:5173`
- Per-user-email quota:
  - daily: 5
  - monthly: 10
  - reset time zone: `UTC` (`00:00` / first day of month `00:00`)
- Ordered mail workflow:
  1. send user thank-you email (HTML bilingual)
  2. send admin notification email (HTML bilingual)
- Partial-success retry model:
  - if step 1 succeeds and step 2 fails, backend returns partial success and retries admin email asynchronously.

## Quick start with Docker Compose

```bash
cd backend
cp .env.example .env
# edit MAIL_SMTP_PASSWORD

docker compose up -d --build
```

Check health:

```bash
curl http://localhost:8080/actuator/health
```

## Environment variables

See `.env.example` for all options.

Required secret:

- `MAIL_SMTP_PASSWORD` : SMTP authorization code for `MAIL_USERNAME`

## API

Base path: `/api/mail`

### 1) Submit contact

`POST /api/mail/contact`

```json
{
  "requestId": "optional-idempotency-key",
  "userEmail": "user@example.com",
  "locale": "en",
  "subject": "Need help",
  "content": "Hello team..."
}
```

### 2) Submit dataset

`POST /api/mail/dataset`

```json
{
  "requestId": "optional-idempotency-key",
  "userEmail": "user@example.com",
  "locale": "en",
  "datasetName": "My Dataset",
  "shortDescription": "desc",
  "dataFormatScale": ".png, 10k",
  "cloudStorageLink1": "https://example.com/1",
  "cloudStorageLink2": "https://example.com/2",
  "usageLicense": "CC BY 4.0",
  "citationMethod": "APA",
  "coverImageName": "cover.png",
  "coverImageDataUrl": "data:image/png;base64,..."
}
```

### 3) Query status

`GET /api/mail/status/{requestId}`

## Response shape (submit)

```json
{
  "ok": true,
  "code": "OK",
  "state": "DONE",
  "message": "Both thank-you and admin emails were sent successfully.",
  "requestId": "...",
  "retryScheduled": false,
  "quota": {
    "dailyUsed": 1,
    "dailyLimit": 5,
    "monthlyUsed": 1,
    "monthlyLimit": 10,
    "nextDailyResetAt": "2026-03-05T00:00:00Z",
    "nextMonthlyResetAt": "2026-04-01T00:00:00Z"
  }
}
```

Possible `code` values include:

- `OK`
- `PARTIAL_SUCCESS_ADMIN_RETRYING`
- `RATE_LIMIT_DAILY`
- `RATE_LIMIT_MONTHLY`
- `USER_MAIL_SEND_FAILED`
- `ADMIN_MAIL_SEND_FAILED`
- `INVALID_PAYLOAD`
- `INTERNAL_ERROR`

## Local run (without Docker)

```bash
cd backend
export MAIL_SMTP_PASSWORD='your-auth-code'
mvn spring-boot:run
```
