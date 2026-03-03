import { submissionMailConfig } from '../config/submissionMailConfig'

const senderRateLimitMap = new Map()
let senderRateLimitLoaded = false

function dayKeyOf(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function monthKeyOf(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function normalizeSenderEntry(entry, dayKey, monthKey) {
  const normalized = {
    dayKey,
    dayCount: 0,
    monthKey,
    monthCount: 0,
  }
  if (!entry || typeof entry !== 'object') {
    return normalized
  }

  if (entry.dayKey === dayKey) {
    normalized.dayCount = Number.isFinite(entry.dayCount) ? Number(entry.dayCount) : 0
  }
  if (entry.monthKey === monthKey) {
    normalized.monthCount = Number.isFinite(entry.monthCount) ? Number(entry.monthCount) : 0
  }

  return normalized
}

function loadSenderRateLimitMap() {
  if (senderRateLimitLoaded) {
    return
  }
  senderRateLimitLoaded = true

  if (typeof window === 'undefined') {
    return
  }

  const raw = localStorage.getItem(submissionMailConfig.rateLimit.storageKey)
  if (!raw) {
    return
  }

  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return
    }

    Object.entries(parsed).forEach(([email, entry]) => {
      if (email) {
        senderRateLimitMap.set(email, entry)
      }
    })
  } catch {
    // ignore malformed data
  }
}

function persistSenderRateLimitMap() {
  if (typeof window === 'undefined') {
    return
  }

  const payload = Object.fromEntries(senderRateLimitMap.entries())
  localStorage.setItem(submissionMailConfig.rateLimit.storageKey, JSON.stringify(payload))
}

function getSenderRateEntry(senderEmail) {
  loadSenderRateLimitMap()

  const normalizedEmail = String(senderEmail || '').trim().toLowerCase()
  const now = new Date()
  const dayKey = dayKeyOf(now)
  const monthKey = monthKeyOf(now)
  const currentEntry = senderRateLimitMap.get(normalizedEmail)
  const normalizedEntry = normalizeSenderEntry(currentEntry, dayKey, monthKey)

  senderRateLimitMap.set(normalizedEmail, normalizedEntry)
  return { normalizedEmail, normalizedEntry }
}

function checkSenderRateLimit(senderEmail) {
  const { normalizedEntry } = getSenderRateEntry(senderEmail)
  const { dailyPerEmail, monthlyPerEmail } = submissionMailConfig.rateLimit

  if (normalizedEntry.dayCount >= dailyPerEmail) {
    return {
      ok: false,
      code: 'rate_limit_daily',
      reason: submissionMailConfig.messages.rateLimitDaily,
    }
  }

  if (normalizedEntry.monthCount >= monthlyPerEmail) {
    return {
      ok: false,
      code: 'rate_limit_monthly',
      reason: submissionMailConfig.messages.rateLimitMonthly,
    }
  }

  return { ok: true }
}

function consumeSenderRateLimit(senderEmail) {
  const { normalizedEmail, normalizedEntry } = getSenderRateEntry(senderEmail)
  normalizedEntry.dayCount += 1
  normalizedEntry.monthCount += 1
  senderRateLimitMap.set(normalizedEmail, normalizedEntry)
  persistSenderRateLimitMap()
}

function isProviderConfigured() {
  const { serviceId, templateId, publicKey } = submissionMailConfig.provider
  const hasPlaceholder = [serviceId, templateId, publicKey].some((value) => /^YOUR_/.test(String(value || '').trim()))
  return Boolean(serviceId && templateId && publicKey && !hasPlaceholder)
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

function parseErrorReason(raw, fallback) {
  const text = String(raw || '').trim()
  if (!text) {
    return fallback
  }

  try {
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed === 'object') {
      return parsed.message || parsed.error || fallback
    }
  } catch {
    // keep raw text
  }

  return text
}

export async function sendSubmissionMail({ userEmail, submitType, subject, html, text }) {
  const rateCheck = checkSenderRateLimit(userEmail)
  if (!rateCheck.ok) {
    return { ok: false, code: rateCheck.code, reason: rateCheck.reason }
  }

  if (!isProviderConfigured()) {
    return {
      ok: false,
      code: 'provider_not_configured',
      reason: submissionMailConfig.messages.mailConfigMissing,
    }
  }

  const provider = submissionMailConfig.provider
  const payload = {
    service_id: provider.serviceId,
    template_id: provider.templateId,
    user_id: provider.publicKey,
    template_params: {
      to_email: submissionMailConfig.targetEmail,
      sender_email: submissionMailConfig.senderEmail,
      reply_to: userEmail,
      user_email: userEmail,
      submit_type: submitType,
      subject,
      html_content: html,
      text_content: text,
      sent_at: new Date().toISOString(),
    },
  }

  if (provider.privateKey) {
    payload.accessToken = provider.privateKey
  }

  try {
    const response = await fetchWithTimeout(
      provider.endpoint,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      provider.timeoutMs,
    )

    if (!response.ok) {
      const errorText = await response.text()
      const detail = parseErrorReason(errorText, `HTTP ${response.status}`)
      const knownStatusCodes = new Set([400, 401, 403, 404, 408, 413, 415, 422, 429, 500, 502, 503, 504])
      const code = knownStatusCodes.has(response.status) ? `provider_http_${response.status}` : 'provider_http_other'
      return {
        ok: false,
        code,
        httpStatus: response.status,
        detail,
        reason: `${submissionMailConfig.messages.mailSendFailedPrefix}${detail}`,
      }
    }

    consumeSenderRateLimit(userEmail)
    return { ok: true }
  } catch (error) {
    if (error?.name === 'AbortError') {
      return {
        ok: false,
        code: 'request_timeout',
        reason: `${submissionMailConfig.messages.mailSendFailedPrefix}Request timeout.`,
      }
    }

    return {
      ok: false,
      code: 'network_or_cors',
      reason: `${submissionMailConfig.messages.mailSendFailedPrefix}${submissionMailConfig.messages.mailSendNetworkError}`,
    }
  }
}
