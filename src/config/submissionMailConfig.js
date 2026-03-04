const DEFAULT_MAIL_API_BASE = 'http://38.76.219.201:8080'

function normalizeBaseUrl(rawUrl) {
  const url = String(rawUrl || '').trim()
  if (!url) {
    return DEFAULT_MAIL_API_BASE
  }
  return url.replace(/\/+$/, '')
}

function parsePositiveInt(rawValue, fallback) {
  const parsed = Number.parseInt(String(rawValue || ''), 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return parsed
}

function joinErrorItems(...items) {
  return items.map((item) => String(item || '').trim()).filter(Boolean)
}

const failureAlertCopy = {
  default: {
    title: 'Email delivery failed',
    description: 'The submission could not be processed due to an unexpected error.',
    hint: 'Please retry in a few minutes. If it still fails, contact the administrator.',
  },
  RATE_LIMIT_DAILY: {
    title: 'Daily sending limit reached',
    description: 'This email address has reached the daily sending quota.',
    hint: 'Please submit again after the daily quota resets.',
  },
  RATE_LIMIT_MONTHLY: {
    title: 'Monthly sending limit reached',
    description: 'This email address has reached the monthly sending quota.',
    hint: 'Please submit again after the monthly quota resets.',
  },
  USER_MAIL_SEND_FAILED: {
    title: 'Thank-you email delivery failed',
    description: 'The system could not deliver the thank-you email to your mailbox.',
    hint: 'Please confirm your email address and try again.',
  },
  ADMIN_MAIL_SEND_FAILED: {
    title: 'Administrator delivery failed',
    description: 'Your submission was received, but administrator delivery failed.',
    hint: 'The backend will retry automatically. No action is required now.',
  },
  INVALID_PAYLOAD: {
    title: 'Invalid submission data',
    description: 'Some submitted fields are invalid or missing.',
    hint: 'Please fix the highlighted fields and resubmit.',
  },
  INTERNAL_ERROR: {
    title: 'Server internal error',
    description: 'The mail service encountered an internal error.',
    hint: 'Please retry later.',
  },
  REQUEST_TIMEOUT: {
    title: 'Request timed out',
    description: 'The browser timed out while waiting for the mail service response.',
    hint: 'Please check your network and retry.',
  },
  NETWORK_ERROR: {
    title: 'Network request failed',
    description: 'The browser could not reach the mail service endpoint.',
    hint: 'Please check your network, browser extensions, and CORS settings.',
  },
  HTTP_400: {
    title: 'Bad request (400)',
    description: 'The backend rejected this request.',
    hint: 'Please check input values and retry.',
  },
  HTTP_404: {
    title: 'Mail endpoint not found (404)',
    description: 'The frontend mail endpoint is not available.',
    hint: 'Please verify backend deployment route configuration.',
  },
  HTTP_429: {
    title: 'Too many requests (429)',
    description: 'The service is throttling requests.',
    hint: 'Please wait and retry.',
  },
  HTTP_500: {
    title: 'Server error (500)',
    description: 'The backend returned an internal server error.',
    hint: 'Please retry later.',
  },
}

export const submissionMailConfig = {
  api: {
    baseUrl: normalizeBaseUrl(import.meta.env?.VITE_MAIL_API_BASE),
    timeoutMs: parsePositiveInt(import.meta.env?.VITE_MAIL_API_TIMEOUT_MS, 15000),
    defaultLocale: 'en',
    endpoints: {
      contact: '/api/mail/contact',
      dataset: '/api/mail/dataset',
      status: '/api/mail/status',
    },
  },
  messages: {
    validationTitle: 'Submission blocked',
    validationDescription: 'Please fix the following issues before submitting:',
    contactValidationDescription: 'Please fix the following contact form issues:',
    datasetSuccess: 'Dataset submission has been sent successfully.',
    contactSuccess: 'Contact submission has been sent successfully.',
    partialSuccessWarning: 'Submission accepted. Admin notification is being retried in the background.',
  },
  failureAlerts: failureAlertCopy,
}

function pickFailureCopy(code) {
  const normalizedCode = String(code || '').trim()
  if (!normalizedCode) {
    return failureAlertCopy.default
  }

  if (failureAlertCopy[normalizedCode]) {
    return failureAlertCopy[normalizedCode]
  }

  const upperCode = normalizedCode.toUpperCase()
  if (failureAlertCopy[upperCode]) {
    return failureAlertCopy[upperCode]
  }

  return failureAlertCopy.default
}

function formatQuotaHint(quota) {
  if (!quota || typeof quota !== 'object') {
    return ''
  }

  const dailyHint = Number.isFinite(quota.dailyUsed) && Number.isFinite(quota.dailyLimit)
    ? `Daily quota: ${quota.dailyUsed}/${quota.dailyLimit}.`
    : ''
  const monthlyHint = Number.isFinite(quota.monthlyUsed) && Number.isFinite(quota.monthlyLimit)
    ? `Monthly quota: ${quota.monthlyUsed}/${quota.monthlyLimit}.`
    : ''
  const nextDaily = quota.nextDailyResetAt ? `Next daily reset: ${quota.nextDailyResetAt}.` : ''
  const nextMonthly = quota.nextMonthlyResetAt ? `Next monthly reset: ${quota.nextMonthlyResetAt}.` : ''

  return joinErrorItems(dailyHint, monthlyHint, nextDaily, nextMonthly).join(' ')
}

function collectFailureDetails(sendResult, fallbackHint) {
  const details = []

  if (sendResult?.httpStatus) {
    details.push(`HTTP status: ${sendResult.httpStatus}`)
  }

  if (sendResult?.message) {
    details.push(sendResult.message)
  }

  if (Array.isArray(sendResult?.details)) {
    details.push(...sendResult.details)
  }

  if (sendResult?.reason && sendResult.reason !== fallbackHint) {
    details.push(sendResult.reason)
  }

  const quotaHint = formatQuotaHint(sendResult?.quota)
  if (quotaHint) {
    details.push(quotaHint)
  }

  return [...new Set(joinErrorItems(...details))]
}

export function resolveMailFailureAlert(sendResult, submitType = 'dataset_submission') {
  const copy = pickFailureCopy(sendResult?.code)
  const submitTypeLabel = submitType === 'contact_submission' ? 'Contact submission' : 'Dataset submission'
  const details = collectFailureDetails(sendResult, copy.hint)

  return {
    title: copy.title,
    description: `${submitTypeLabel}: ${copy.description}`,
    errors: details.length
      ? details
      : [copy.hint],
  }
}
