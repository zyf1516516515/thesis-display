import { submissionMailConfig } from '../config/submissionMailConfig'

function buildApiUrl(path) {
  const baseUrl = String(submissionMailConfig.api.baseUrl || '').replace(/\/+$/, '')
  const endpoint = String(path || '').startsWith('/') ? path : `/${String(path || '')}`
  return `${baseUrl}${endpoint}`
}

function normalizeHttpErrorCode(status) {
  if (!Number.isFinite(status) || status <= 0) {
    return 'HTTP_ERROR'
  }
  return `HTTP_${status}`
}

async function parseResponseBody(response) {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

async function requestWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

function normalizeSuccessResponse(payload, httpStatus) {
  if (!payload || typeof payload !== 'object') {
    return {
      ok: false,
      code: 'INVALID_BACKEND_RESPONSE',
      state: 'FAILED',
      message: 'Backend returned an invalid response payload.',
      details: [],
      httpStatus,
      reason: 'Backend returned an invalid response payload.',
    }
  }

  const normalizedOk = Boolean(payload.ok)
  return {
    ok: normalizedOk,
    code: payload.code || (normalizedOk ? 'OK' : 'UNKNOWN_ERROR'),
    state: payload.state || (normalizedOk ? 'DONE' : 'FAILED'),
    message: payload.message || '',
    requestId: payload.requestId || '',
    retryScheduled: Boolean(payload.retryScheduled),
    quota: payload.quota || null,
    details: Array.isArray(payload.details) ? payload.details : [],
    httpStatus,
  }
}

function normalizeErrorResponse(payload, httpStatus) {
  const code = payload?.code || normalizeHttpErrorCode(httpStatus)
  const message = payload?.message || `HTTP ${httpStatus}`
  const details = Array.isArray(payload?.details)
    ? payload.details
    : payload?.details
      ? [String(payload.details)]
      : []

  return {
    ok: false,
    code,
    state: 'FAILED',
    message,
    details,
    httpStatus,
    reason: message,
  }
}

async function postSubmission(path, body) {
  const url = buildApiUrl(path)

  try {
    const response = await requestWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      submissionMailConfig.api.timeoutMs,
    )

    const payload = await parseResponseBody(response)
    if (response.ok) {
      return normalizeSuccessResponse(payload, response.status)
    }

    return normalizeErrorResponse(payload, response.status)
  } catch (error) {
    if (error?.name === 'AbortError') {
      return {
        ok: false,
        code: 'REQUEST_TIMEOUT',
        state: 'FAILED',
        message: 'Request timeout.',
        details: [],
        reason: 'Request timeout.',
      }
    }

    return {
      ok: false,
      code: 'NETWORK_ERROR',
      state: 'FAILED',
      message: 'Network request failed.',
      details: [],
      reason: error?.message || 'Network request failed.',
    }
  }
}

export async function submitDataset(payload) {
  return postSubmission(submissionMailConfig.api.endpoints.dataset, payload)
}

export async function submitContact(payload) {
  return postSubmission(submissionMailConfig.api.endpoints.contact, payload)
}
