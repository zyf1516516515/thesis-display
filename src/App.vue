<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { siteContent } from './config/siteContent'
import { resolveMailFailureAlert, submissionMailConfig } from './config/submissionMailConfig'
import { getNavAction, getVideoPlaybackMode } from './utils/navigation'
import { extractAnchorFromHash, resolveMediaSrc } from './utils/mediaResolver'
import { submitContact, submitDataset } from './utils/submissionApi'

const comingSoonVisible = ref(false)
const comingSoonMessage = ref(siteContent.meta.comingSoonMessage || '正在开发中')
const datasetSubmissionVisible = ref(false)
const datasetValidationVisible = ref(false)
const datasetValidationTitle = ref(submissionMailConfig.messages.validationTitle)
const datasetValidationDescription = ref(submissionMailConfig.messages.validationDescription)
const datasetValidationErrors = ref([])
const contactModalVisible = ref(false)
const originalPreviewVisible = ref(false)
const originalPreviewDownloading = ref(false)
const originalPreviewMedia = ref(createEmptyOriginalPreviewMedia())
const originalPreviewImageLoading = ref(false)
const originalPreviewImageError = ref('')
const originalPreviewImageProgress = ref(0)
const originalPreviewImageLoadedBytes = ref(0)
const originalPreviewImageTotalBytes = ref(0)
const originalPreviewImageSpeedBytesPerSec = ref(0)
const originalPreviewImageStartedAtMs = ref(0)
const originalPreviewDownloadError = ref('')
const coverInputRef = ref(null)
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const URL_TOKEN_PATTERN = /https?:\/\/[^\s]+/gi
const LINK_FIELD_KEYS = ['cloudStorageLink1', 'cloudStorageLink2']
const MANUAL_INPUT_VALUE = '__manual_input__'
const DNS_TIMEOUT_MS = 5000
const URL_TIMEOUT_MS = 6000
const DOWNLOAD_FETCH_TIMEOUT_MS = 45000
const CHECK_CACHE_TTL_MS = 5 * 60 * 1000
const MAX_COVER_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_COVER_DATA_URL_LENGTH = Math.ceil((MAX_COVER_IMAGE_BYTES * 4) / 3) + 2048
const HERO_MEDIA_VISUAL_ALIGN_OFFSET_PX = 0
const HERO_BULLET_VERTICAL_GAP_PX = 20
const HERO_BULLET_FRAME_SHRINK_PX = 5
const ANONYMOUS_OSS_BLOCKED_RESPONSE_OVERRIDE_PARAMS = new Set([
  'response-content-type',
  'response-content-language',
  'response-expires',
  'response-cache-control',
  'response-content-disposition',
  'response-content-encoding',
])
const OSS_SIGNED_URL_PARAM_PATTERN = /[?&](?:OSSAccessKeyId|Signature|Expires|x-oss-signature|x-oss-credential|x-oss-date|x-oss-expires|x-oss-security-token)=/i
const BACKEND_FIELD_ERROR_PATTERN = /^([^:]+):\s*(.+)$/

function createEmptyOriginalPreviewMedia() {
  return {
    type: 'image',
    src: '',
    previewUrl: '',
    downloadUrl: '',
    title: '',
  }
}

function createEmptyDatasetForm() {
  return {
    datasetName: '',
    shortDescription: '',
    dataFormatScale: '',
    cloudStorageLink1: '',
    cloudStorageLink2: '',
    usageLicense: '',
    citationMethod: '',
    userEmail: '',
    coverImageName: '',
    coverImagePreview: '',
    coverImageSizeBytes: 0,
    coverImageDataUrl: '',
  }
}

function createCheckState(status = 'idle', message = '') {
  return { status, message }
}

function createDatasetFieldChecks() {
  return {
    datasetName: createCheckState(),
    shortDescription: createCheckState(),
    dataFormatScale: createCheckState(),
    cloudStorageLinks: createCheckState(),
    usageLicense: createCheckState(),
    citationMethod: createCheckState(),
    coverImage: createCheckState(),
  }
}

const datasetForm = ref(createEmptyDatasetForm())
const datasetFieldChecks = ref(createDatasetFieldChecks())
const emailCheck = ref(createCheckState())
const linkChecks = ref(LINK_FIELD_KEYS.map(() => createCheckState()))
const dataFormatSelection = ref('')
const usageLicenseSelection = ref('')
const datasetSubmitting = ref(false)
const contactSubmitting = ref(false)
const contactEmailCheck = ref(createCheckState())
const contactFieldChecks = ref({
  subject: createCheckState(),
  content: createCheckState(),
})
const contactForm = ref({
  userEmail: '',
  subject: '',
  content: '',
})
const BODY_LOCK_CLASS = 'modal-scroll-lock'
const HEADER_OFFSET = 94
const logoSrc = computed(() => resolveMediaSrc(siteContent.meta.logoUrl))
const progressiveImageLoadedKeys = ref(new Set())
const activatedPreviewVideoKeys = ref(new Set())
const heroVideoGateVisible = ref(Boolean(siteContent.hero?.video?.src))
const heroBulletListRef = ref(null)
const heroMediaWrapRef = ref(null)
const heroVideoRef = ref(null)
const heroBulletListHeightPx = ref(0)
const heroMediaHeightPx = ref(0)
const heroBulletListStyle = computed(() =>
  heroBulletListHeightPx.value > 0 ? { height: `${heroBulletListHeightPx.value}px` } : {},
)
const heroMediaWrapStyle = computed(() =>
  heroMediaHeightPx.value > 0 ? { height: `${heroMediaHeightPx.value}px` } : {},
)
const dnsCheckCache = new Map()
const urlReachabilityCache = new Map()
let originalPreviewFetchController = null
let originalPreviewObjectUrl = ''
let originalPreviewRequestSeq = 0
let heroVideoGateTimer = null
let layoutSyncRaf = 0
let heroResizeObserver = null

function syncHeroMediaHeight() {
  const bulletListEl = heroBulletListRef.value
  if (!bulletListEl) {
    heroBulletListHeightPx.value = 0
    heroMediaHeightPx.value = 0
    return
  }
  if (typeof window !== 'undefined' && window.innerWidth <= 980) {
    heroBulletListHeightPx.value = 0
    heroMediaHeightPx.value = 0
    return
  }
  const groups = Array.from(bulletListEl.querySelectorAll('.arrow-group'))
  if (!groups.length) {
    heroBulletListHeightPx.value = 0
    heroMediaHeightPx.value = 0
    return
  }
  const contentHeight = groups.reduce((sum, element) => sum + Math.ceil(element.getBoundingClientRect().height || 0), 0)
  const spacingHeight = HERO_BULLET_VERTICAL_GAP_PX * Math.max(groups.length - 1, 0)
  const mediaTargetHeight = Math.ceil(contentHeight + spacingHeight)
  if (mediaTargetHeight <= 0) {
    heroBulletListHeightPx.value = 0
    heroMediaHeightPx.value = 0
    return
  }
  const bulletTargetHeight = Math.max(contentHeight, mediaTargetHeight - HERO_BULLET_FRAME_SHRINK_PX)
  heroBulletListHeightPx.value = bulletTargetHeight
  heroMediaHeightPx.value = Math.max(mediaTargetHeight - HERO_MEDIA_VISUAL_ALIGN_OFFSET_PX, 0)
}

function syncHeroAndDatasetLayout() {
  syncHeroMediaHeight()
}

function scheduleHeroAndDatasetLayoutSync() {
  if (typeof window === 'undefined') {
    return
  }
  if (layoutSyncRaf) {
    cancelAnimationFrame(layoutSyncRaf)
  }
  layoutSyncRaf = window.requestAnimationFrame(() => {
    layoutSyncRaf = 0
    syncHeroAndDatasetLayout()
  })
}

function setBodyScrollLock(locked) {
  if (typeof document === 'undefined') {
    return
  }
  const body = document.body
  body.classList.toggle(BODY_LOCK_CLASS, locked)
}

function resolveComingSoonMessage(messageKey) {
  const messageMap = siteContent.meta.comingSoonMessages || {}
  return messageMap[messageKey] || messageMap.default || siteContent.meta.comingSoonMessage || '正在开发中'
}

function openNotice(message) {
  comingSoonMessage.value = message
  comingSoonVisible.value = true
}

function openComingSoon(messageKey = 'default') {
  openNotice(resolveComingSoonMessage(messageKey))
}

function closeComingSoon() {
  comingSoonVisible.value = false
}

function openDatasetSubmissionModal() {
  datasetSubmissionVisible.value = true
}

function closeDatasetSubmissionModal() {
  datasetSubmissionVisible.value = false
}

function openDatasetValidationAlert(errors, title = submissionMailConfig.messages.validationTitle, description = submissionMailConfig.messages.validationDescription) {
  datasetValidationTitle.value = title
  datasetValidationDescription.value = description
  datasetValidationErrors.value = [...new Set(errors.filter(Boolean))]
  datasetValidationVisible.value = true
}

function createRequestId(prefix) {
  const safePrefix = String(prefix || 'submit').trim() || 'submit'
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${safePrefix}-${crypto.randomUUID()}`
  }
  const randomPart = Math.random().toString(36).slice(2, 10)
  return `${safePrefix}-${Date.now()}-${randomPart}`
}

function parseBackendFieldErrors(sendResult) {
  if (String(sendResult?.code || '') !== 'INVALID_PAYLOAD' || !Array.isArray(sendResult?.details)) {
    return []
  }

  return sendResult.details
    .map((item) => {
      const raw = String(item || '').trim()
      if (!raw) {
        return null
      }
      const match = raw.match(BACKEND_FIELD_ERROR_PATTERN)
      if (!match) {
        return { field: '', message: raw }
      }
      return {
        field: String(match[1] || '').trim(),
        message: String(match[2] || '').trim() || raw,
      }
    })
    .filter(Boolean)
}

function applyDatasetFieldErrorsFromBackend(fieldErrors) {
  fieldErrors.forEach(({ field, message }) => {
    switch (field) {
      case 'datasetName':
      case 'shortDescription':
      case 'dataFormatScale':
      case 'usageLicense':
      case 'citationMethod':
        setDatasetFieldCheck(field, 'invalid', message)
        break
      case 'cloudStorageLink1':
        setLinkCheck(0, 'invalid', message)
        setDatasetFieldCheck('cloudStorageLinks', 'invalid', message)
        break
      case 'cloudStorageLink2':
        setLinkCheck(1, 'invalid', message)
        setDatasetFieldCheck('cloudStorageLinks', 'invalid', message)
        break
      case 'coverImageName':
      case 'coverImageDataUrl':
        setDatasetFieldCheck('coverImage', 'invalid', message)
        break
      case 'userEmail':
        emailCheck.value = createCheckState('invalid', message)
        break
      default:
        break
    }
  })
}

function applyContactFieldErrorsFromBackend(fieldErrors) {
  fieldErrors.forEach(({ field, message }) => {
    switch (field) {
      case 'subject':
      case 'content':
        setContactFieldCheck(field, 'invalid', message)
        break
      case 'userEmail':
        contactEmailCheck.value = createCheckState('invalid', message)
        break
      default:
        break
    }
  })
}

function applyBackendFieldErrors(sendResult, submitType) {
  const fieldErrors = parseBackendFieldErrors(sendResult)
  if (!fieldErrors.length) {
    return
  }

  if (submitType === 'contact_submission') {
    applyContactFieldErrorsFromBackend(fieldErrors)
    return
  }

  applyDatasetFieldErrorsFromBackend(fieldErrors)
}

function openMailFailureAlert(sendResult, submitType) {
  applyBackendFieldErrors(sendResult, submitType)
  const alertPayload = resolveMailFailureAlert(sendResult, submitType)
  openDatasetValidationAlert(alertPayload.errors, alertPayload.title, alertPayload.description)
}

function closeDatasetValidationAlert() {
  datasetValidationVisible.value = false
  datasetValidationErrors.value = []
}

function triggerCoverUpload() {
  coverInputRef.value?.click()
}

function revokeCoverPreview() {
  const preview = datasetForm.value.coverImagePreview
  if (preview && preview.startsWith('blob:')) {
    URL.revokeObjectURL(preview)
  }
}

function handleCoverChange(event) {
  const [file] = event.target.files || []
  revokeCoverPreview()
  if (!file) {
    datasetForm.value.coverImageName = ''
    datasetForm.value.coverImagePreview = ''
    datasetForm.value.coverImageSizeBytes = 0
    datasetForm.value.coverImageDataUrl = ''
    validateCoverImage()
    return
  }
  datasetForm.value.coverImageName = file.name
  datasetForm.value.coverImagePreview = URL.createObjectURL(file)
  datasetForm.value.coverImageSizeBytes = file.size
  if (file.size > MAX_COVER_IMAGE_BYTES) {
    datasetForm.value.coverImageDataUrl = ''
    validateCoverImage()
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    datasetForm.value.coverImageDataUrl = typeof reader.result === 'string' ? reader.result : ''
    validateCoverImage()
  }
  reader.onerror = () => {
    datasetForm.value.coverImageDataUrl = ''
    validateCoverImage()
  }
  reader.readAsDataURL(file)
}

function resetDatasetForm() {
  revokeCoverPreview()
  datasetForm.value = createEmptyDatasetForm()
  datasetFieldChecks.value = createDatasetFieldChecks()
  emailCheck.value = createCheckState()
  linkChecks.value = LINK_FIELD_KEYS.map(() => createCheckState())
  dataFormatSelection.value = ''
  usageLicenseSelection.value = ''
  closeDatasetValidationAlert()
  if (coverInputRef.value) {
    coverInputRef.value.value = ''
  }
}

function resetContactForm() {
  contactForm.value = {
    userEmail: '',
    subject: '',
    content: '',
  }
  contactEmailCheck.value = createCheckState()
  contactFieldChecks.value = {
    subject: createCheckState(),
    content: createCheckState(),
  }
}

function setDatasetFieldCheck(fieldKey, status, message = '') {
  datasetFieldChecks.value = {
    ...datasetFieldChecks.value,
    [fieldKey]: createCheckState(status, message),
  }
}

function resetDatasetFieldCheck(fieldKey) {
  setDatasetFieldCheck(fieldKey, 'idle', '')
}

function validateRequiredTextField(fieldKey, label) {
  const value = datasetForm.value[fieldKey]?.trim() || ''
  if (!value) {
    setDatasetFieldCheck(fieldKey, 'invalid', `${label} is required.`)
    return false
  }
  setDatasetFieldCheck(fieldKey, 'valid', '')
  return true
}

function validateCoverImage() {
  if (!datasetForm.value.coverImagePreview) {
    setDatasetFieldCheck('coverImage', 'invalid', 'Please upload one cover image.')
    return false
  }
  if (datasetForm.value.coverImageSizeBytes > MAX_COVER_IMAGE_BYTES) {
    setDatasetFieldCheck('coverImage', 'invalid', 'Cover image is too large for submission. Maximum size is 5 MB.')
    return false
  }
  if (datasetForm.value.coverImageDataUrl && datasetForm.value.coverImageDataUrl.length > MAX_COVER_DATA_URL_LENGTH) {
    setDatasetFieldCheck('coverImage', 'invalid', 'Cover image is too large for submission. Please upload a smaller image.')
    return false
  }
  setDatasetFieldCheck('coverImage', 'valid', '')
  return true
}

function getCheckIcon(status) {
  if (status === 'valid') {
    return '✓'
  }
  if (status === 'invalid') {
    return '✕'
  }
  if (status === 'checking') {
    return '...'
  }
  return ''
}

function resetEmailCheck() {
  emailCheck.value = createCheckState()
}

function resetContactEmailCheck() {
  contactEmailCheck.value = createCheckState()
}

function setContactFieldCheck(fieldKey, status, message = '') {
  contactFieldChecks.value = {
    ...contactFieldChecks.value,
    [fieldKey]: createCheckState(status, message),
  }
}

function resetContactFieldCheck(fieldKey) {
  setContactFieldCheck(fieldKey, 'idle', '')
}

function validateContactRequiredField(fieldKey, label) {
  const value = contactForm.value[fieldKey]?.trim() || ''
  if (!value) {
    setContactFieldCheck(fieldKey, 'invalid', `${label} is required.`)
    return false
  }
  setContactFieldCheck(fieldKey, 'valid', '')
  return true
}

function handleDataFormatSelectionChange() {
  if (!dataFormatSelection.value) {
    datasetForm.value.dataFormatScale = ''
    resetDatasetFieldCheck('dataFormatScale')
    return
  }
  if (dataFormatSelection.value === MANUAL_INPUT_VALUE) {
    datasetForm.value.dataFormatScale = ''
    setDatasetFieldCheck('dataFormatScale', 'invalid', 'Data Format & Scale is required.')
    return
  }

  datasetForm.value.dataFormatScale = dataFormatSelection.value
  validateRequiredTextField('dataFormatScale', 'Data Format & Scale')
}

function handleUsageLicenseSelectionChange() {
  if (!usageLicenseSelection.value) {
    datasetForm.value.usageLicense = ''
    resetDatasetFieldCheck('usageLicense')
    return
  }
  if (usageLicenseSelection.value === MANUAL_INPUT_VALUE) {
    datasetForm.value.usageLicense = ''
    setDatasetFieldCheck('usageLicense', 'invalid', 'Usage License is required.')
    return
  }

  datasetForm.value.usageLicense = usageLicenseSelection.value
  validateRequiredTextField('usageLicense', 'Usage License')
}

function setLinkCheck(index, status, message = '') {
  linkChecks.value = linkChecks.value.map((item, currentIndex) => {
    if (currentIndex !== index) {
      return item
    }
    return createCheckState(status, message)
  })
}

function resetCloudLinkCheck(index) {
  setLinkCheck(index, 'idle', '')
  resetDatasetFieldCheck('cloudStorageLinks')
}

function evaluateCloudLinksGroupCheck() {
  const populatedIndexes = LINK_FIELD_KEYS
    .map((key, index) => ({ key, index }))
    .filter(({ key }) => Boolean(datasetForm.value[key].trim()))
    .map(({ index }) => index)

  if (!populatedIndexes.length) {
    setDatasetFieldCheck('cloudStorageLinks', 'invalid', 'At least one cloud storage link is required.')
    return false
  }

  const hasInvalid = populatedIndexes.some((index) => linkChecks.value[index].status === 'invalid')
  if (hasInvalid) {
    setDatasetFieldCheck('cloudStorageLinks', 'invalid', 'Please fix invalid cloud storage link(s).')
    return false
  }

  const hasChecking = populatedIndexes.some((index) => linkChecks.value[index].status === 'checking')
  if (hasChecking) {
    setDatasetFieldCheck('cloudStorageLinks', 'checking', 'Checking cloud storage link(s)...')
    return false
  }

  const allValid = populatedIndexes.every((index) => linkChecks.value[index].status === 'valid')
  if (allValid) {
    setDatasetFieldCheck('cloudStorageLinks', 'valid', '')
    return true
  }

  setDatasetFieldCheck('cloudStorageLinks', 'idle', '')
  return true
}

function validateSingleLinkFormat(rawValue) {
  const value = rawValue.trim()
  if (!value) {
    return { ok: false, reason: 'Please enter a URL.' }
  }

  const detected = value.match(URL_TOKEN_PATTERN) || []
  if (detected.length > 1) {
    return { ok: false, reason: 'Multiple links detected. Please enter exactly one URL.' }
  }
  if (/\s/.test(value)) {
    return { ok: false, reason: 'Invalid URL format.' }
  }

  try {
    const parsed = new URL(value)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { ok: false, reason: 'Invalid URL format. Only http/https is supported.' }
    }
    return { ok: true, normalizedUrl: parsed.toString() }
  } catch {
    return { ok: false, reason: 'Invalid URL format.' }
  }
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

function getCachedValidationResult(cacheMap, key) {
  const cached = cacheMap.get(key)
  if (!cached) {
    return null
  }
  if (cached.expiresAt <= Date.now()) {
    cacheMap.delete(key)
    return null
  }
  return { ...cached.result }
}

function setCachedValidationResult(cacheMap, key, result) {
  cacheMap.set(key, {
    expiresAt: Date.now() + CHECK_CACHE_TTL_MS,
    result: { ...result },
  })
}

async function checkUrlReachability(targetUrl) {
  const cacheKey = String(targetUrl || '').trim()
  const cached = getCachedValidationResult(urlReachabilityCache, cacheKey)
  if (cached) {
    return cached
  }

  if (window.location.protocol === 'https:' && targetUrl.startsWith('http://')) {
    const blocked = { ok: false, reason: 'HTTP links are blocked on HTTPS pages.' }
    setCachedValidationResult(urlReachabilityCache, cacheKey, blocked)
    return blocked
  }

  try {
    await fetchWithTimeout(targetUrl, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' }, URL_TIMEOUT_MS)
    const passed = { ok: true, reason: 'URL format and reachability check passed.' }
    setCachedValidationResult(urlReachabilityCache, cacheKey, passed)
    return passed
  } catch {
    try {
      await fetchWithTimeout(targetUrl, { method: 'GET', mode: 'no-cors', cache: 'no-store' }, URL_TIMEOUT_MS)
      const passed = { ok: true, reason: 'URL format and reachability check passed.' }
      setCachedValidationResult(urlReachabilityCache, cacheKey, passed)
      return passed
    } catch {
      const failed = { ok: false, reason: 'URL is not reachable.' }
      setCachedValidationResult(urlReachabilityCache, cacheKey, failed)
      return failed
    }
  }
}

async function validateCloudLink(index) {
  const fieldKey = LINK_FIELD_KEYS[index]
  const currentValue = datasetForm.value[fieldKey]
  if (!currentValue.trim()) {
    setLinkCheck(index, 'idle', '')
    return true
  }

  const formatResult = validateSingleLinkFormat(currentValue)
  if (!formatResult.ok) {
    setLinkCheck(index, 'invalid', formatResult.reason)
    return false
  }

  setLinkCheck(index, 'checking', 'Checking URL reachability...')
  const reachability = await checkUrlReachability(formatResult.normalizedUrl)
  if (datasetForm.value[fieldKey] !== currentValue) {
    return false
  }

  if (reachability.ok) {
    datasetForm.value[fieldKey] = formatResult.normalizedUrl
    setLinkCheck(index, 'valid', reachability.reason)
    return true
  }
  setLinkCheck(index, 'invalid', reachability.reason)
  return false
}

async function handleCloudLinkBlur(index) {
  await validateCloudLink(index)
  evaluateCloudLinksGroupCheck()
}

async function handleCloudLinkCheck(index) {
  await validateCloudLink(index)
  evaluateCloudLinksGroupCheck()
}

async function validateCloudLinksBeforeSubmit() {
  const populatedIndexes = LINK_FIELD_KEYS
    .map((key, index) => ({ key, index }))
    .filter(({ key }) => Boolean(datasetForm.value[key].trim()))
    .map(({ index }) => index)

  if (!populatedIndexes.length) {
    setDatasetFieldCheck('cloudStorageLinks', 'invalid', 'At least one cloud storage link is required.')
    return false
  }

  const results = await Promise.all(populatedIndexes.map((index) => validateCloudLink(index)))
  const allPassed = results.every(Boolean)

  if (!allPassed) {
    setDatasetFieldCheck('cloudStorageLinks', 'invalid', 'Please fix invalid cloud storage link(s).')
    return false
  }

  setDatasetFieldCheck('cloudStorageLinks', 'valid', '')
  return true
}

async function queryDnsRecord(domain, recordType) {
  const cacheKey = `${recordType}:${domain}`
  const cached = getCachedValidationResult(dnsCheckCache, cacheKey)
  if (cached) {
    return cached
  }

  const providers = [
    `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${recordType}`,
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${recordType}`,
  ]

  let providerReached = false
  for (const endpoint of providers) {
    try {
      const response = await fetchWithTimeout(
        endpoint,
        { method: 'GET', headers: { Accept: 'application/dns-json' }, cache: 'no-store' },
        DNS_TIMEOUT_MS,
      )
      if (!response.ok) {
        continue
      }
      providerReached = true
      const payload = await response.json()
      const answers = Array.isArray(payload.Answer) ? payload.Answer : []
      const expectedType = recordType === 'MX' ? 15 : 1
      const hasRecord = answers.some((item) => Number(item.type) === expectedType)

      if (Number(payload.Status) === 3) {
        const result = { ok: false, providerReached: true, reason: 'Email domain does not exist.' }
        setCachedValidationResult(dnsCheckCache, cacheKey, result)
        return result
      }
      if (hasRecord) {
        const result = { ok: true, providerReached: true }
        setCachedValidationResult(dnsCheckCache, cacheKey, result)
        return result
      }
    } catch {
      // try next provider
    }
  }

  if (!providerReached) {
    const result = { ok: false, providerReached: false, reason: 'Email domain reachability check failed.' }
    setCachedValidationResult(dnsCheckCache, cacheKey, result)
    return result
  }
  const result = { ok: false, providerReached: true, reason: '' }
  setCachedValidationResult(dnsCheckCache, cacheKey, result)
  return result
}

async function validateEmailAddress(currentValue, required, requiredMessage) {
  if (!currentValue) {
    if (required) {
      return createCheckState('invalid', requiredMessage)
    }
    return createCheckState('idle', '')
  }

  if (!EMAIL_PATTERN.test(currentValue)) {
    return createCheckState('invalid', 'Invalid email format.')
  }

  const domain = currentValue.split('@').at(-1)?.toLowerCase() || ''
  if (!domain || domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) {
    return createCheckState('invalid', 'Invalid email domain format.')
  }

  const mxResult = await queryDnsRecord(domain, 'MX')
  if (mxResult.ok) {
    return createCheckState('valid', 'Email format and domain check passed.')
  }
  if (mxResult.reason === 'Email domain does not exist.') {
    return createCheckState('invalid', mxResult.reason)
  }

  const aResult = await queryDnsRecord(domain, 'A')
  if (aResult.ok) {
    return createCheckState('valid', 'Domain is reachable (A record found).')
  }

  if (!mxResult.providerReached && !aResult.providerReached) {
    return createCheckState('invalid', 'Email domain reachability check failed.')
  }
  return createCheckState('invalid', 'No MX/A DNS record found for this domain.')
}

async function validateUserEmail(required = true) {
  const currentValue = datasetForm.value.userEmail.trim()
  if (!currentValue && !required) {
    emailCheck.value = createCheckState('idle', '')
    return true
  }

  emailCheck.value = createCheckState('checking', 'Checking email domain reachability...')
  const result = await validateEmailAddress(currentValue, required, 'User Email is required.')
  if (datasetForm.value.userEmail.trim() !== currentValue) {
    return false
  }
  emailCheck.value = result
  return result.status === 'valid'
}

async function validateContactEmail(required = true) {
  const currentValue = contactForm.value.userEmail.trim()
  if (!currentValue && !required) {
    contactEmailCheck.value = createCheckState('idle', '')
    return true
  }

  contactEmailCheck.value = createCheckState('checking', 'Checking email domain reachability...')
  const result = await validateEmailAddress(currentValue, required, 'Your Email is required.')
  if (contactForm.value.userEmail.trim() !== currentValue) {
    return false
  }
  contactEmailCheck.value = result
  return result.status === 'valid'
}

async function submitDatasetSubmission() {
  if (datasetSubmitting.value) {
    return
  }

  const submitErrors = []

  if (!validateRequiredTextField('datasetName', 'Dataset Name')) {
    submitErrors.push(datasetFieldChecks.value.datasetName.message)
  }
  if (!validateRequiredTextField('shortDescription', 'Short Description')) {
    submitErrors.push(datasetFieldChecks.value.shortDescription.message)
  }
  if (!validateRequiredTextField('dataFormatScale', 'Data Format & Scale')) {
    submitErrors.push(datasetFieldChecks.value.dataFormatScale.message)
  }
  if (!validateRequiredTextField('usageLicense', 'Usage License')) {
    submitErrors.push(datasetFieldChecks.value.usageLicense.message)
  }
  if (!validateRequiredTextField('citationMethod', 'Citation Method')) {
    submitErrors.push(datasetFieldChecks.value.citationMethod.message)
  }

  const emailPassed = await validateUserEmail(true)
  if (!emailPassed) {
    submitErrors.push(emailCheck.value.message || 'User Email check failed.')
  }

  const linksPassed = await validateCloudLinksBeforeSubmit()
  if (!linksPassed) {
    submitErrors.push(datasetFieldChecks.value.cloudStorageLinks.message || 'Cloud storage link check failed.')
  }

  if (!validateCoverImage()) {
    submitErrors.push(datasetFieldChecks.value.coverImage.message)
  }

  if (submitErrors.length) {
    openDatasetValidationAlert(submitErrors)
    return
  }

  datasetSubmitting.value = true
  const sendResult = await submitDataset({
    requestId: createRequestId('dataset'),
    userEmail: datasetForm.value.userEmail.trim(),
    locale: submissionMailConfig.api.defaultLocale,
    datasetName: datasetForm.value.datasetName.trim(),
    shortDescription: datasetForm.value.shortDescription.trim(),
    dataFormatScale: datasetForm.value.dataFormatScale.trim(),
    cloudStorageLink1: datasetForm.value.cloudStorageLink1.trim(),
    cloudStorageLink2: datasetForm.value.cloudStorageLink2.trim(),
    usageLicense: datasetForm.value.usageLicense.trim(),
    citationMethod: datasetForm.value.citationMethod.trim(),
    coverImageName: datasetForm.value.coverImageName.trim(),
    coverImageDataUrl: datasetForm.value.coverImageDataUrl || '',
  })
  datasetSubmitting.value = false

  if (!sendResult.ok) {
    openMailFailureAlert(sendResult, 'dataset_submission')
    return
  }

  closeDatasetSubmissionModal()
  resetDatasetForm()
  if (sendResult.code === 'PARTIAL_SUCCESS_ADMIN_RETRYING') {
    openNotice(`${submissionMailConfig.messages.datasetSuccess}\n${submissionMailConfig.messages.partialSuccessWarning}`)
    return
  }
  openNotice(submissionMailConfig.messages.datasetSuccess)
}

function openContactModal() {
  resetContactEmailCheck()
  contactFieldChecks.value = {
    subject: createCheckState(),
    content: createCheckState(),
  }
  contactModalVisible.value = true
}

function closeContactModal() {
  contactModalVisible.value = false
}

async function submitContactForm() {
  if (contactSubmitting.value) {
    return
  }

  const submitErrors = []

  if (!validateContactRequiredField('subject', 'Title')) {
    submitErrors.push(contactFieldChecks.value.subject.message)
  }
  if (!validateContactRequiredField('content', 'Content')) {
    submitErrors.push(contactFieldChecks.value.content.message)
  }

  const emailPassed = await validateContactEmail(true)
  if (!emailPassed) {
    submitErrors.push(contactEmailCheck.value.message || 'Email check failed.')
  }

  if (submitErrors.length) {
    openDatasetValidationAlert(
      submitErrors,
      submissionMailConfig.messages.validationTitle,
      submissionMailConfig.messages.contactValidationDescription,
    )
    return
  }

  contactSubmitting.value = true
  const sendResult = await submitContact({
    requestId: createRequestId('contact'),
    userEmail: contactForm.value.userEmail.trim(),
    locale: submissionMailConfig.api.defaultLocale,
    subject: contactForm.value.subject.trim(),
    content: contactForm.value.content.trim(),
  })
  contactSubmitting.value = false

  if (!sendResult.ok) {
    openMailFailureAlert(sendResult, 'contact_submission')
    return
  }

  closeContactModal()
  resetContactForm()
  if (sendResult.code === 'PARTIAL_SUCCESS_ADMIN_RETRYING') {
    openNotice(`${submissionMailConfig.messages.contactSuccess}\n${submissionMailConfig.messages.partialSuccessWarning}`)
    return
  }
  openNotice(submissionMailConfig.messages.contactSuccess)
}

watch(
  [comingSoonVisible, datasetSubmissionVisible, datasetValidationVisible, contactModalVisible, originalPreviewVisible],
  ([comingSoon, datasetSubmission, datasetValidation, contact, originalPreview]) => {
    setBodyScrollLock(comingSoon || datasetSubmission || datasetValidation || contact || originalPreview)
  },
)

watch(
  heroVideoGateVisible,
  (isVisible) => {
    if (!isVisible) {
      nextTick(() => {
        scheduleHeroAndDatasetLayoutSync()
        ensureHeroVideoPlayback()
      })
    }
  },
)

function scrollToAnchor(anchorId, updateHash = true) {
  const targetEl = document.getElementById(anchorId)
  if (!targetEl) {
    return
  }

  const top = window.scrollY + targetEl.getBoundingClientRect().top - HEADER_OFFSET
  window.scrollTo({ top, behavior: 'smooth' })

  if (updateHash) {
    history.replaceState(null, '', `#${anchorId}`)
  }
}

function handleNavClick(item) {
  if (item.url) {
    window.open(item.url, '_blank', 'noopener,noreferrer')
    return
  }

  const action = getNavAction(item.key)
  if (action.type === 'anchor') {
    scrollToAnchor(action.target)
    return
  }
  openComingSoon(item.key)
}

function handleHashChange() {
  const anchorId = extractAnchorFromHash(window.location.hash)
  if (!anchorId) {
    return
  }
  scrollToAnchor(anchorId, false)
}

function getVideoMode(slot) {
  return getVideoPlaybackMode(slot)
}

function resolvePosterSrc(src) {
  const resolved = resolveMediaSrc(src)
  return resolved || undefined
}

function resolvePreviewSrc(src) {
  const resolved = resolveMediaSrc(src)
  return sanitizeDownloadUrlForAnonymousOss(forceOriginalPublicPath(resolved))
}

function resolveDownloadSrc(src) {
  const resolved = resolveMediaSrc(src)
  return sanitizeDownloadUrlForAnonymousOss(resolved)
}

function forceOriginalPublicPath(rawUrl) {
  if (!rawUrl) {
    return ''
  }
  const rewritten = String(rawUrl).replace(/\/public_min(?=\/|$)/g, '/public')
  try {
    const parsed = new URL(rewritten)
    parsed.pathname = parsed.pathname.replace(/\/public_min(?=\/|$)/g, '/public')
    return parsed.toString()
  } catch {
    return rewritten
  }
}

function alignPreviewPathWithDownload(previewUrl, downloadUrl) {
  if (!previewUrl || !downloadUrl) {
    return previewUrl || ''
  }

  try {
    const base = typeof window !== 'undefined' ? window.location.href : 'https://example.com'
    const previewParsed = new URL(previewUrl, base)
    const downloadParsed = new URL(downloadUrl, base)
    const normalizedDownloadPath = downloadParsed.pathname.replace(/\/public_min(?=\/|$)/g, '/public')

    if (!normalizedDownloadPath.includes('/public/')) {
      return previewUrl
    }

    previewParsed.pathname = normalizedDownloadPath
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(previewUrl)) {
      return previewParsed.toString()
    }
    return `${previewParsed.pathname}${previewParsed.search}${previewParsed.hash}`
  } catch {
    return previewUrl
  }
}

function markProgressiveImageLoaded(imageKey) {
  if (!imageKey || progressiveImageLoadedKeys.value.has(imageKey)) {
    return
  }
  const next = new Set(progressiveImageLoadedKeys.value)
  next.add(imageKey)
  progressiveImageLoadedKeys.value = next
}

function isProgressiveImageLoaded(imageKey) {
  if (!imageKey) {
    return false
  }
  return progressiveImageLoadedKeys.value.has(imageKey)
}

function markPreviewVideoActivated(videoKey) {
  if (!videoKey || activatedPreviewVideoKeys.value.has(videoKey)) {
    return
  }
  const next = new Set(activatedPreviewVideoKeys.value)
  next.add(videoKey)
  activatedPreviewVideoKeys.value = next
}

function isPreviewVideoActivated(videoKey) {
  if (!videoKey) {
    return false
  }
  return activatedPreviewVideoKeys.value.has(videoKey)
}

function getManualVideoSrc(videoKey, rawSrc) {
  if (!videoKey || !rawSrc) {
    return ''
  }
  if (!isPreviewVideoActivated(videoKey)) {
    return ''
  }
  return resolveMediaSrc(rawSrc)
}

function handlePreviewVideoClick(videoKey, event) {
  if (!videoKey) {
    return
  }
  if (!isPreviewVideoActivated(videoKey)) {
    markPreviewVideoActivated(videoKey)
    nextTick(() => {
      const target = event?.currentTarget
      if (target && typeof target.play === 'function') {
        const maybePromise = target.play()
        if (maybePromise && typeof maybePromise.catch === 'function') {
          maybePromise.catch(() => {})
        }
      }
    })
  }
}

function markHeroVideoReady() {
  if (!heroVideoGateVisible.value) {
    return
  }
  heroVideoGateVisible.value = false
  if (heroVideoGateTimer) {
    clearTimeout(heroVideoGateTimer)
    heroVideoGateTimer = null
  }
}

function handleHeroVideoReady() {
  markHeroVideoReady()
  nextTick(() => {
    ensureHeroVideoPlayback()
  })
}

function handleHeroVideoError() {
  markHeroVideoReady()
}

function ensureHeroVideoPlayback() {
  const heroVideoEl = heroVideoRef.value
  if (!heroVideoEl || heroVideoGateVisible.value) {
    return
  }
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    return
  }
  if (!heroVideoEl.paused && !heroVideoEl.ended) {
    return
  }
  const maybePromise = heroVideoEl.play()
  if (maybePromise && typeof maybePromise.catch === 'function') {
    maybePromise.catch(() => {})
  }
}

function handleHeroPlaybackVisibilityRestore() {
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
    return
  }
  ensureHeroVideoPlayback()
}

function isLikelySignedOssUrl(rawUrl) {
  if (!rawUrl) {
    return false
  }
  return OSS_SIGNED_URL_PARAM_PATTERN.test(rawUrl)
}

function stripBlockedResponseOverrideQuery(rawUrl) {
  if (!rawUrl) {
    return ''
  }

  return rawUrl
    .replace(
      /([?&])response-content-(?:type|language|expires|cache-control|disposition|encoding)=[^&#]*/gi,
      '$1',
    )
    .replace(/\?&/g, '?')
    .replace(/[?&](?=#|$)/g, '')
    .replace(/\?$/, '')
}

function sanitizeDownloadUrlForAnonymousOss(rawUrl) {
  if (!rawUrl) {
    return ''
  }

  // Signed OSS URLs rely on query parameters for signature validation.
  // Removing/normalizing these params may invalidate the signature.
  if (isLikelySignedOssUrl(rawUrl)) {
    return rawUrl
  }

  try {
    const base = typeof window !== 'undefined' ? window.location.href : 'https://example.com'
    const parsed = new URL(rawUrl, base)
    let removed = false

    for (const key of [...parsed.searchParams.keys()]) {
      if (ANONYMOUS_OSS_BLOCKED_RESPONSE_OVERRIDE_PARAMS.has(key.toLowerCase())) {
        parsed.searchParams.delete(key)
        removed = true
      }
    }

    if (!removed) {
      return stripBlockedResponseOverrideQuery(rawUrl)
    }

    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(rawUrl)) {
      return stripBlockedResponseOverrideQuery(parsed.toString())
    }
    return stripBlockedResponseOverrideQuery(`${parsed.pathname}${parsed.search}${parsed.hash}`)
  } catch {
    return stripBlockedResponseOverrideQuery(rawUrl)
  }
}

function resetOriginalPreviewImageLoadState() {
  originalPreviewImageLoading.value = false
  originalPreviewImageError.value = ''
  originalPreviewImageProgress.value = 0
  originalPreviewImageLoadedBytes.value = 0
  originalPreviewImageTotalBytes.value = 0
  originalPreviewImageSpeedBytesPerSec.value = 0
  originalPreviewImageStartedAtMs.value = 0
  originalPreviewDownloadError.value = ''
}

function abortOriginalPreviewFetch() {
  originalPreviewFetchController?.abort()
  originalPreviewFetchController = null
}

function clearOriginalPreviewObjectUrl() {
  if (originalPreviewObjectUrl) {
    URL.revokeObjectURL(originalPreviewObjectUrl)
    originalPreviewObjectUrl = ''
  }
}

function formatMB(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0.00 MB'
  }
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(2)} MB`
}

function getOriginalImageProgressPercentText() {
  const percent = Math.min(100, Math.max(0, originalPreviewImageProgress.value || 0))
  return `${percent.toFixed(0)}%`
}

function getOriginalImageProgressDetailsText() {
  const loadedText = formatMB(originalPreviewImageLoadedBytes.value)
  const totalText = formatMB(originalPreviewImageTotalBytes.value)
  const speedText = `${formatMB(originalPreviewImageSpeedBytesPerSec.value)}/s`
  return `${loadedText} / ${totalText} · ${speedText}`
}

function handleOriginalImageLoaded() {
  if (originalPreviewImageTotalBytes.value > 0) {
    originalPreviewImageLoadedBytes.value = Math.max(
      originalPreviewImageLoadedBytes.value,
      originalPreviewImageTotalBytes.value,
    )
  }
  const elapsedMs = Date.now() - originalPreviewImageStartedAtMs.value
  if (elapsedMs > 0 && originalPreviewImageLoadedBytes.value > 0) {
    originalPreviewImageSpeedBytesPerSec.value = originalPreviewImageLoadedBytes.value / (elapsedMs / 1000)
  }
  originalPreviewImageProgress.value = 100
  originalPreviewImageLoading.value = false
}

function handleOriginalImageError() {
  originalPreviewImageLoading.value = false
  if (!originalPreviewImageError.value) {
    originalPreviewImageError.value = 'Failed to load original image. Please try Open in New Tab.'
    return
  }
  if (!originalPreviewImageError.value.includes('Please try Open in New Tab.')) {
    originalPreviewImageError.value = `${originalPreviewImageError.value} Please try Open in New Tab.`
  }
}

async function loadOriginalImageWithProgress(sourceUrl, requestId) {
  abortOriginalPreviewFetch()
  const controller = new AbortController()
  originalPreviewFetchController = controller
  originalPreviewImageStartedAtMs.value = Date.now()

  try {
    const response = await fetch(sourceUrl, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`image request failed with status ${response.status}`)
    }

    if (!response.body) {
      if (requestId !== originalPreviewRequestSeq || controller.signal.aborted) {
        return
      }
      originalPreviewMedia.value = {
        ...originalPreviewMedia.value,
        src: sourceUrl,
      }
      return
    }

    const totalBytes = Number(response.headers.get('content-length') || '0')
    if (Number.isFinite(totalBytes) && totalBytes > 0) {
      originalPreviewImageTotalBytes.value = totalBytes
    }

    const reader = response.body.getReader()
    const chunks = []
    let loadedBytes = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      if (requestId !== originalPreviewRequestSeq || controller.signal.aborted) {
        return
      }
      if (!value) {
        continue
      }
      chunks.push(value)
      loadedBytes += value.byteLength
      originalPreviewImageLoadedBytes.value = loadedBytes
      if (originalPreviewImageTotalBytes.value > 0) {
        originalPreviewImageProgress.value = Math.min(
          100,
          (loadedBytes / originalPreviewImageTotalBytes.value) * 100,
        )
      }
      const elapsedMs = Date.now() - originalPreviewImageStartedAtMs.value
      if (elapsedMs > 0) {
        originalPreviewImageSpeedBytesPerSec.value = loadedBytes / (elapsedMs / 1000)
      }
    }

    if (requestId !== originalPreviewRequestSeq || controller.signal.aborted) {
      return
    }

    const contentType = response.headers.get('content-type') || 'image/png'
    const blob = new Blob(chunks, { type: contentType })
    clearOriginalPreviewObjectUrl()
    originalPreviewObjectUrl = URL.createObjectURL(blob)
    originalPreviewMedia.value = {
      ...originalPreviewMedia.value,
      src: originalPreviewObjectUrl,
    }
  } catch {
    if (requestId !== originalPreviewRequestSeq || controller.signal.aborted) {
      return
    }
    originalPreviewImageError.value = 'Loading progress is unavailable. Showing direct source.'
    originalPreviewMedia.value = {
      ...originalPreviewMedia.value,
      src: sourceUrl,
    }
  } finally {
    if (requestId !== originalPreviewRequestSeq) {
      return
    }
    originalPreviewFetchController = null
  }
}

function openOriginalMediaPreview(type, previewRawUrl, downloadRawUrl, title = '') {
  const downloadUrl = resolveDownloadSrc(downloadRawUrl)
  const previewUrl = alignPreviewPathWithDownload(resolvePreviewSrc(previewRawUrl), downloadUrl)
  if (!previewUrl || !downloadUrl) {
    return
  }
  originalPreviewRequestSeq += 1
  const requestId = originalPreviewRequestSeq
  abortOriginalPreviewFetch()
  clearOriginalPreviewObjectUrl()
  resetOriginalPreviewImageLoadState()

  originalPreviewMedia.value = {
    type,
    src: type === 'image' ? '' : previewUrl,
    previewUrl,
    downloadUrl,
    title,
  }

  if (type === 'image') {
    originalPreviewImageLoading.value = true
    void loadOriginalImageWithProgress(previewUrl, requestId)
  }

  originalPreviewVisible.value = true
}

function closeOriginalMediaPreview() {
  originalPreviewRequestSeq += 1
  abortOriginalPreviewFetch()
  clearOriginalPreviewObjectUrl()
  resetOriginalPreviewImageLoadState()
  originalPreviewMedia.value = createEmptyOriginalPreviewMedia()
  originalPreviewVisible.value = false
}

function getOriginalPreviewTitle(type) {
  if (type === 'video') {
    return siteContent.meta.mediaPreviewActions.videoTitle
  }
  return siteContent.meta.mediaPreviewActions.imageTitle
}

function getFilenameFromUrl(rawUrl, fallbackType = 'file') {
  try {
    const parsed = new URL(rawUrl)
    const decodedPath = decodeURIComponent(parsed.pathname || '')
    const parts = decodedPath.split('/')
    const fileName = parts[parts.length - 1]
    if (fileName) {
      return fileName
    }
  } catch {
    // ignore parse errors and use fallback below
  }
  if (fallbackType === 'video') {
    return 'original-video.mp4'
  }
  return 'original-image.png'
}

function triggerLocalDownload(downloadHref, fileName) {
  const anchor = document.createElement('a')
  anchor.href = downloadHref
  anchor.download = fileName
  anchor.rel = 'noopener noreferrer'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

function isCrossOriginUrl(rawUrl) {
  if (!rawUrl) {
    return false
  }

  try {
    const base = typeof window !== 'undefined' ? window.location.href : 'https://example.com'
    const parsed = new URL(rawUrl, base)
    if (typeof window === 'undefined') {
      return /^https?:\/\//.test(rawUrl)
    }
    return parsed.origin !== window.location.origin
  } catch {
    return /^https?:\/\//.test(rawUrl)
  }
}

async function downloadOriginalMedia() {
  const sourceUrl = resolveDownloadSrc(originalPreviewMedia.value.downloadUrl)
  if (!sourceUrl || originalPreviewDownloading.value) {
    return
  }

  const fileName = getFilenameFromUrl(sourceUrl, originalPreviewMedia.value.type)
  originalPreviewDownloading.value = true
  originalPreviewDownloadError.value = ''

  if (isCrossOriginUrl(sourceUrl)) {
    // Prefer browser-native download for cross-origin files to avoid fetch/CORS/proxy failures on large assets.
    try {
      triggerLocalDownload(sourceUrl, fileName)
    } catch {
      originalPreviewDownloadError.value = 'Direct download failed. Please use Open in New Tab and Save As.'
    } finally {
      setTimeout(() => {
        originalPreviewDownloading.value = false
      }, 700)
    }
    return
  }

  try {
    const response = await fetchWithTimeout(sourceUrl, {}, DOWNLOAD_FETCH_TIMEOUT_MS)
    if (!response.ok) {
      throw new Error(`download request failed with status ${response.status}`)
    }
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    triggerLocalDownload(blobUrl, fileName)
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl)
    }, 1000)
  } catch {
    originalPreviewDownloadError.value = 'Direct download failed. Please use Open in New Tab and Save As.'
  } finally {
    originalPreviewDownloading.value = false
  }
}

function handleGlobalKeydown(event) {
  if (event.key !== 'Escape') {
    return
  }
  if (originalPreviewVisible.value) {
    closeOriginalMediaPreview()
  }
}

onMounted(() => {
  document.title = siteContent.meta.pageTitle

  window.addEventListener('hashchange', handleHashChange)
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('resize', scheduleHeroAndDatasetLayoutSync)
  window.addEventListener('pageshow', handleHeroPlaybackVisibilityRestore)
  window.addEventListener('focus', handleHeroPlaybackVisibilityRestore)
  document.addEventListener('visibilitychange', handleHeroPlaybackVisibilityRestore)
  if (heroVideoGateVisible.value) {
    heroVideoGateTimer = setTimeout(() => {
      markHeroVideoReady()
    }, 9000)
  }

  nextTick(() => {
    scheduleHeroAndDatasetLayoutSync()

    if (typeof ResizeObserver !== 'undefined') {
      if (heroBulletListRef.value) {
        heroResizeObserver = new ResizeObserver(() => {
          scheduleHeroAndDatasetLayoutSync()
        })
        heroResizeObserver.observe(heroBulletListRef.value)
      }
    }

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready
        .then(() => {
          scheduleHeroAndDatasetLayoutSync()
        })
        .catch(() => {})
    }
  })
})

onBeforeUnmount(() => {
  setBodyScrollLock(false)
  abortOriginalPreviewFetch()
  clearOriginalPreviewObjectUrl()
  resetOriginalPreviewImageLoadState()
  if (heroVideoGateTimer) {
    clearTimeout(heroVideoGateTimer)
    heroVideoGateTimer = null
  }
  if (layoutSyncRaf) {
    cancelAnimationFrame(layoutSyncRaf)
    layoutSyncRaf = 0
  }
  if (heroResizeObserver) {
    heroResizeObserver.disconnect()
    heroResizeObserver = null
  }
  revokeCoverPreview()
  document.removeEventListener('visibilitychange', handleHeroPlaybackVisibilityRestore)
  window.removeEventListener('pageshow', handleHeroPlaybackVisibilityRestore)
  window.removeEventListener('focus', handleHeroPlaybackVisibilityRestore)
  window.removeEventListener('resize', scheduleHeroAndDatasetLayoutSync)
  window.removeEventListener('hashchange', handleHashChange)
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <div class="app-root">
    <header class="page-header">
      <div class="shell header-inner" :class="{ 'without-logo': !logoSrc }">
        <div v-if="logoSrc" class="logo-box">
          <img :src="logoSrc" :alt="siteContent.meta.logoAlt" class="logo-image" />
        </div>
        <h1 class="header-title">{{ siteContent.header.title }}</h1>
      </div>
    </header>

    <div v-if="heroVideoGateVisible" class="hero-gate-overlay">
      <div class="hero-gate-card">
        <p class="hero-gate-title">Loading opening video...</p>
        <div class="hero-gate-spinner" aria-hidden="true" />
      </div>
    </div>

    <main class="page-main" v-show="!heroVideoGateVisible">
      <div class="first-screen">
        <section class="shell hero-section">
          <h2 class="focus-title">{{ siteContent.hero.title }}</h2>
          <div ref="heroBulletListRef" class="hero-bullet-list" :style="heroBulletListStyle">
            <div class="arrow-group" v-for="(bullet, index) in siteContent.hero.bullets" :key="`hero-bullet-${index}`">
              <span class="arrow-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="#8EAADC" width="18" height="18">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </span>
              <div class="arrow-lines">
                <p v-for="(line, lineIndex) in bullet" :key="`hero-bullet-line-${index}-${lineIndex}`" class="line-text">
                  {{ line }}
                </p>
              </div>
            </div>
          </div>

          <div class="hero-media-card">
            <div ref="heroMediaWrapRef" class="hero-media-wrap" :style="heroMediaWrapStyle">
              <video
                v-if="resolveMediaSrc(siteContent.hero.video.src)"
                ref="heroVideoRef"
                class="hero-video"
                :src="resolveMediaSrc(siteContent.hero.video.src)"
                :poster="resolvePosterSrc(siteContent.hero.video.poster)"
                :autoplay="getVideoMode(siteContent.hero.video.slot).autoplay"
                :controls="getVideoMode(siteContent.hero.video.slot).controls"
                :loop="getVideoMode(siteContent.hero.video.slot).loop"
                :muted="getVideoMode(siteContent.hero.video.slot).muted"
                playsinline
                preload="auto"
                @loadeddata="handleHeroVideoReady"
                @canplay="handleHeroVideoReady"
                @canplaythrough="handleHeroVideoReady"
                @error="handleHeroVideoError"
              />
            </div>
            <p
              v-if="resolvePreviewSrc(siteContent.hero.video.previewUrl) && resolveDownloadSrc(siteContent.hero.video.downloadUrl)"
              class="media-action-row media-action-row-video hero-video-action-row"
            >
              <button
                type="button"
                class="media-download-link media-preview-trigger"
                @click="openOriginalMediaPreview('video', siteContent.hero.video.previewUrl, siteContent.hero.video.downloadUrl, siteContent.meta.mediaDownloadLabels.video)"
              >
                {{ siteContent.meta.mediaDownloadLabels.video }}
              </button>
            </p>
          </div>
        </section>

        <section class="shell nav-section">
          <button
            v-for="item in siteContent.nav"
            :key="item.key"
            type="button"
            :class="['pill-btn', { 'pill-btn-paper': item.key === 'paper' }]"
            @click="handleNavClick(item)"
          >
            {{ item.label }}
          </button>
        </section>
      </div>

      <div class="content-mid-backdrop">
      <section class="shell block-section">
        <h2 class="section-title"><span class="title-mark">◼</span>{{ siteContent.sections.performance.title }}</h2>
        <article class="panel-card">
          <h3 class="panel-title">{{ siteContent.sections.performance.panelTitle }}</h3>
          <div
            v-if="resolveMediaSrc(siteContent.sections.performance.image.placeholderSrc)"
            :class="['progressive-image-wrap', 'performance-image', { 'is-loaded': isProgressiveImageLoaded('performance_demo') }]"
          >
            <img
              v-if="!isProgressiveImageLoaded('performance_demo')"
              :src="resolveMediaSrc(siteContent.sections.performance.image.placeholderSrc)"
              :alt="`${siteContent.sections.performance.image.alt} placeholder`"
              class="media-image progressive-image-placeholder"
            />
            <img
              v-if="resolveMediaSrc(siteContent.sections.performance.image.src)"
              :src="resolveMediaSrc(siteContent.sections.performance.image.src)"
              :alt="siteContent.sections.performance.image.alt"
              :class="[
                'media-image',
                'progressive-image-final',
                'progressive-image-final-force-visible',
                { 'is-loaded': isProgressiveImageLoaded('performance_demo') },
              ]"
              @load="markProgressiveImageLoaded('performance_demo')"
            />
          </div>
          <p v-if="resolvePreviewSrc(siteContent.sections.performance.image.previewUrl)" class="media-action-row media-action-row-image performance-action-row">
            <button
              type="button"
              class="media-download-link media-preview-trigger"
              @click="openOriginalMediaPreview('image', siteContent.sections.performance.image.previewUrl, siteContent.sections.performance.image.downloadUrl, siteContent.meta.mediaDownloadLabels.image)"
            >
              {{ siteContent.meta.mediaDownloadLabels.image }}
            </button>
          </p>
        </article>
      </section>

      <section class="shell block-section light-panel">
        <h3 class="sub-panel-title">{{ siteContent.sections.resultVideo.title }}</h3>
        <div class="video-grid-top">
          <article
            v-for="video in siteContent.sections.resultVideo.videos.slice(0, 2)"
            :key="video.key"
            :class="['video-card', `video-card-${video.key}`]"
          >
            <div class="video-media-frame">
              <video
                :class="[
                  'section-video',
                  {
                    'result-video-1-zoom': video.key === 'result_video_1',
                    'is-click-to-load': !isPreviewVideoActivated(video.key),
                  },
                ]"
                :src="getManualVideoSrc(video.key, video.src)"
                :poster="resolvePosterSrc(video.poster)"
                :autoplay="false"
                :controls="isPreviewVideoActivated(video.key) ? getVideoMode(video.slot).controls : false"
                :loop="false"
                :muted="false"
                :title="!isPreviewVideoActivated(video.key) ? 'Click to load preview video' : ''"
                playsinline
                preload="none"
                @click="handlePreviewVideoClick(video.key, $event)"
              />
            </div>
            <p v-if="resolvePreviewSrc(video.previewUrl) && resolveDownloadSrc(video.downloadUrl)" class="media-action-row media-action-row-video result-video-action-row">
              <button
                type="button"
                class="media-download-link media-preview-trigger"
                @click="openOriginalMediaPreview('video', video.previewUrl, video.downloadUrl, siteContent.meta.mediaDownloadLabels.video)"
              >
                {{ siteContent.meta.mediaDownloadLabels.video }}
              </button>
            </p>
          </article>
        </div>

        <article class="video-card video-card-wide video-card-result_video_3">
          <div class="video-media-frame">
            <video
              :class="['section-video', { 'is-click-to-load': !isPreviewVideoActivated('result_video_3') }]"
              :src="getManualVideoSrc('result_video_3', siteContent.sections.resultVideo.videos[2].src)"
              :poster="resolvePosterSrc(siteContent.sections.resultVideo.videos[2].poster)"
              :autoplay="false"
              :controls="isPreviewVideoActivated('result_video_3') ? getVideoMode(siteContent.sections.resultVideo.videos[2].slot).controls : false"
              :loop="false"
              :muted="false"
              :title="!isPreviewVideoActivated('result_video_3') ? 'Click to load preview video' : ''"
              playsinline
              preload="none"
              @click="handlePreviewVideoClick('result_video_3', $event)"
            />
          </div>
          <p
            v-if="resolvePreviewSrc(siteContent.sections.resultVideo.videos[2].previewUrl) && resolveDownloadSrc(siteContent.sections.resultVideo.videos[2].downloadUrl)"
            class="media-action-row media-action-row-video result-video-action-row"
          >
            <button
              type="button"
              class="media-download-link media-preview-trigger"
              @click="openOriginalMediaPreview('video', siteContent.sections.resultVideo.videos[2].previewUrl, siteContent.sections.resultVideo.videos[2].downloadUrl, siteContent.meta.mediaDownloadLabels.video)"
            >
              {{ siteContent.meta.mediaDownloadLabels.video }}
            </button>
          </p>
        </article>
      </section>

      <section :id="siteContent.sections.dataset.id" class="shell block-section anchor-block title-aligned-section">
        <h2 class="section-title"><span class="title-mark">◼</span>{{ siteContent.sections.dataset.title }}</h2>
        <div class="dataset-layout">
          <div class="dataset-text text-rect">
            <p v-for="(line, index) in siteContent.sections.dataset.lines" :key="`dataset-line-${index}`">{{ line }}</p>
          </div>

          <article class="dataset-card">
            <h3 class="dataset-card-title">{{ siteContent.sections.dataset.cardTitle }}</h3>
            <div
              v-if="resolveMediaSrc(siteContent.sections.dataset.image.placeholderSrc)"
              :class="['progressive-image-wrap', 'dataset-image', { 'is-loaded': isProgressiveImageLoaded('dataset_main') }]"
            >
              <img
                v-if="!isProgressiveImageLoaded('dataset_main')"
                :src="resolveMediaSrc(siteContent.sections.dataset.image.placeholderSrc)"
                :alt="`${siteContent.sections.dataset.image.alt} placeholder`"
                class="media-image progressive-image-placeholder"
              />
              <img
                v-if="resolveMediaSrc(siteContent.sections.dataset.image.src)"
                :src="resolveMediaSrc(siteContent.sections.dataset.image.src)"
                :alt="siteContent.sections.dataset.image.alt"
                :class="['media-image', 'progressive-image-final', { 'is-loaded': isProgressiveImageLoaded('dataset_main') }]"
                @load="markProgressiveImageLoaded('dataset_main')"
              />
            </div>
            <div class="dataset-label-row">
              <span v-for="(label, index) in siteContent.sections.dataset.footerLabels" :key="`dataset-footer-${index}`">{{ label }}</span>
            </div>
            <div class="dataset-btn-row">
              <button
                v-for="button in siteContent.sections.dataset.buttons"
                :key="button.key"
                type="button"
                class="pill-btn pill-btn-paper"
                @click="openComingSoon(button.key)"
              >
                {{ button.label }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <section class="shell block-section title-aligned-section balanced-text-section">
        <h2 class="section-title"><span class="title-mark">◼</span>{{ siteContent.sections.extensibility.title }}</h2>
        <div class="intro-lines text-rect">
          <p v-for="(line, index) in siteContent.sections.extensibility.introLines" :key="`ext-line-${index}`">{{ line }}</p>
        </div>

        <article
          v-for="(block, index) in siteContent.sections.extensibility.blocks"
          :key="block.key"
          class="panel-card compact"
        >
          <h3 class="panel-subtitle">{{ block.title }}</h3>
          <div
            v-if="resolveMediaSrc(block.image.placeholderSrc)"
            :class="[
              'progressive-image-wrap',
              { 'ext-large-image': ['ext_3', 'ext_4', 'ext_5', 'ext_6'].includes(block.key) },
              { 'ext-underwater-expand-right': block.key === 'ext_4' },
              { 'is-loaded': isProgressiveImageLoaded(`ext_${block.key}`) },
            ]"
          >
            <img
              v-if="!isProgressiveImageLoaded(`ext_${block.key}`)"
              :src="resolveMediaSrc(block.image.placeholderSrc)"
              :alt="`${block.image.alt} placeholder`"
              :class="[
                'media-image',
                'progressive-image-placeholder',
              ]"
            />
            <img
              v-if="resolveMediaSrc(block.image.src)"
              :src="resolveMediaSrc(block.image.src)"
              :alt="block.image.alt"
              :class="[
                'media-image',
                'progressive-image-final',
                { 'is-loaded': isProgressiveImageLoaded(`ext_${block.key}`) },
              ]"
              @load="markProgressiveImageLoaded(`ext_${block.key}`)"
            />
          </div>
          <div
            v-if="index === siteContent.sections.extensibility.blocks.length - 1"
            class="panel-note-row"
          >
            <p class="panel-note panel-note-inline">
              {{ siteContent.sections.extensibility.note }}
            </p>
            <p v-if="resolvePreviewSrc(block.image.previewUrl)" class="media-action-row media-action-row-image media-action-row-inline">
              <button
                type="button"
                class="media-download-link media-preview-trigger"
                @click="openOriginalMediaPreview('image', block.image.previewUrl, block.image.downloadUrl, siteContent.meta.mediaDownloadLabels.image)"
              >
                {{ siteContent.meta.mediaDownloadLabels.image }}
              </button>
            </p>
          </div>
          <p v-else-if="resolvePreviewSrc(block.image.previewUrl)" class="media-action-row media-action-row-image">
            <button
              type="button"
              class="media-download-link media-preview-trigger"
              @click="openOriginalMediaPreview('image', block.image.previewUrl, block.image.downloadUrl, siteContent.meta.mediaDownloadLabels.image)"
            >
              {{ siteContent.meta.mediaDownloadLabels.image }}
            </button>
          </p>
        </article>
      </section>

      <section class="shell block-section title-aligned-section balanced-text-section">
        <article class="panel-card compact">
          <h3 class="panel-subtitle">{{ siteContent.sections.handDrawn.title }}</h3>
          <div
            v-if="resolveMediaSrc(siteContent.sections.handDrawn.image.placeholderSrc)"
            :class="['progressive-image-wrap', { 'is-loaded': isProgressiveImageLoaded('hand_drawn') }]"
          >
            <img
              v-if="!isProgressiveImageLoaded('hand_drawn')"
              :src="resolveMediaSrc(siteContent.sections.handDrawn.image.placeholderSrc)"
              :alt="`${siteContent.sections.handDrawn.image.alt} placeholder`"
              class="media-image progressive-image-placeholder"
            />
            <img
              v-if="resolveMediaSrc(siteContent.sections.handDrawn.image.src)"
              :src="resolveMediaSrc(siteContent.sections.handDrawn.image.src)"
              :alt="siteContent.sections.handDrawn.image.alt"
              :class="['media-image', 'progressive-image-final', { 'is-loaded': isProgressiveImageLoaded('hand_drawn') }]"
              @load="markProgressiveImageLoaded('hand_drawn')"
            />
          </div>
          <p v-if="resolvePreviewSrc(siteContent.sections.handDrawn.image.previewUrl)" class="media-action-row media-action-row-image">
            <button
              type="button"
              class="media-download-link media-preview-trigger"
              @click="openOriginalMediaPreview('image', siteContent.sections.handDrawn.image.previewUrl, siteContent.sections.handDrawn.image.downloadUrl, siteContent.meta.mediaDownloadLabels.image)"
            >
              {{ siteContent.meta.mediaDownloadLabels.image }}
            </button>
          </p>
        </article>
      </section>

      <section class="shell block-section">
        <h2 class="section-title"><span class="title-mark">◼</span>{{ siteContent.sections.tutorial.title }}</h2>
        <div class="tutorial-layout">
          <div class="tutorial-list text-rect">
            <div v-for="(item, index) in siteContent.sections.tutorial.bullets" :key="`tutorial-${index}`" class="tutorial-item">
              <span class="tutorial-marker" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="#8EAADC" width="18" height="18">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </span>
              <p>{{ item }}</p>
            </div>
          </div>
          <div class="tutorial-media">
            <div class="video-media-frame tutorial-media-frame">
              <video
                :class="['section-video', 'tutorial-video', { 'is-click-to-load': !isPreviewVideoActivated('tutorial_video') }]"
                :src="getManualVideoSrc('tutorial_video', siteContent.sections.tutorial.video.src)"
                :poster="resolvePosterSrc(siteContent.sections.tutorial.video.poster)"
                :autoplay="false"
                :controls="isPreviewVideoActivated('tutorial_video') ? getVideoMode(siteContent.sections.tutorial.video.slot).controls : false"
                :loop="false"
                :muted="false"
                :title="!isPreviewVideoActivated('tutorial_video') ? 'Click to load preview video' : ''"
                playsinline
                preload="none"
                @click="handlePreviewVideoClick('tutorial_video', $event)"
              />
            </div>
            <p
              v-if="resolvePreviewSrc(siteContent.sections.tutorial.video.previewUrl) && resolveDownloadSrc(siteContent.sections.tutorial.video.downloadUrl)"
              class="media-action-row media-action-row-video tutorial-video-action-row"
            >
              <button
                type="button"
                class="media-download-link media-preview-trigger"
                @click="openOriginalMediaPreview('video', siteContent.sections.tutorial.video.previewUrl, siteContent.sections.tutorial.video.downloadUrl, siteContent.meta.mediaDownloadLabels.video)"
              >
                {{ siteContent.meta.mediaDownloadLabels.video }}
              </button>
            </p>
          </div>
        </div>
      </section>

      <section class="shell block-section title-aligned-section balanced-text-section">
        <h2 class="section-title"><span class="title-mark">◼</span>{{ siteContent.sections.dataRelease.title }}</h2>
        <div class="intro-lines text-rect">
          <p v-for="(line, index) in siteContent.sections.dataRelease.lines" :key="`release-line-${index}`">{{ line }}</p>
        </div>
        <button
          type="button"
          class="pill-btn long-btn section-cta section-cta-wide"
          @click="openDatasetSubmissionModal"
        >
          {{ siteContent.sections.dataRelease.button.label }}
        </button>
      </section>

      <section :id="siteContent.sections.competition.id" class="shell block-section anchor-block title-aligned-section balanced-text-section">
        <h2 class="section-title"><span class="title-mark">◼</span>{{ siteContent.sections.competition.title }}</h2>
        <div class="intro-lines text-rect">
          <p v-for="(line, index) in siteContent.sections.competition.lines" :key="`competition-line-${index}`">{{ line }}</p>
        </div>
        <button
          type="button"
          class="pill-btn pill-btn-paper long-btn section-cta section-cta-wide"
          @click="openComingSoon(siteContent.sections.competition.button.key)"
        >
          {{ siteContent.sections.competition.button.label }}
        </button>
      </section>

      <section :id="siteContent.sections.declaration.id" class="shell block-section anchor-block title-aligned-section balanced-text-section">
        <h2 class="section-title"><span class="title-mark">◼</span>{{ siteContent.sections.declaration.title }}</h2>
        <p class="declaration-text text-rect">
          {{ siteContent.sections.declaration.paragraph }}
          <button type="button" class="contact-inline-link" @click="openContactModal">
            {{ siteContent.sections.declaration.contactText }}
          </button>
          {{ siteContent.sections.declaration.contactTail }}
        </p>
        <div class="declaration-links">
          <a
            v-for="link in siteContent.sections.declaration.links"
            :key="link.key"
            :href="link.url"
            class="declaration-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ link.label }}
          </a>
        </div>
      </section>
      </div>
    </main>

    <Transition name="dataset-form-modal">
      <div v-if="datasetSubmissionVisible" class="dataset-submit-overlay" @click="closeDatasetSubmissionModal">
        <div class="dataset-submit-card" @click.stop>
          <h2 class="dataset-submit-title">{{ siteContent.sections.dataRelease.portal.title }}</h2>
          <p class="dataset-submit-subtitle">
            {{ siteContent.sections.dataRelease.portal.subtitle }}
          </p>
          <div class="dataset-submit-track-row">
            <span
              v-for="track in siteContent.sections.dataRelease.portal.tracks"
              :key="track"
              class="dataset-submit-track-tag"
            >
              {{ track }}
            </span>
          </div>

          <form class="dataset-submit-form" @submit.prevent="submitDatasetSubmission">
            <div class="dataset-submit-grid">
              <section class="dataset-pane">
                <h3 class="dataset-pane-title">{{ siteContent.sections.dataRelease.portal.leftTitle }}</h3>

                <div class="dataset-form-row">
                  <label class="dataset-form-label required">{{ siteContent.sections.dataRelease.portal.fields.datasetName }}</label>
                  <div class="dataset-field-stack">
                    <input
                      v-model="datasetForm.datasetName"
                      type="text"
                      class="dataset-input"
                      :placeholder="siteContent.sections.dataRelease.portal.placeholders.datasetName"
                      @input="resetDatasetFieldCheck('datasetName')"
                      @blur="validateRequiredTextField('datasetName', 'Dataset Name')"
                    />
                    <p
                      v-if="datasetFieldChecks.datasetName.message"
                      :class="['field-check-message', `is-${datasetFieldChecks.datasetName.status}`]"
                    >
                      {{ datasetFieldChecks.datasetName.message }}
                    </p>
                  </div>
                </div>

                <div class="dataset-form-row">
                  <label class="dataset-form-label required">{{ siteContent.sections.dataRelease.portal.fields.shortDescription }}</label>
                  <div class="dataset-field-stack">
                    <textarea
                      v-model="datasetForm.shortDescription"
                      class="dataset-textarea"
                      rows="3"
                      :placeholder="siteContent.sections.dataRelease.portal.placeholders.shortDescription"
                      @input="resetDatasetFieldCheck('shortDescription')"
                      @blur="validateRequiredTextField('shortDescription', 'Short Description')"
                    />
                    <p
                      v-if="datasetFieldChecks.shortDescription.message"
                      :class="['field-check-message', `is-${datasetFieldChecks.shortDescription.status}`]"
                    >
                      {{ datasetFieldChecks.shortDescription.message }}
                    </p>
                  </div>
                </div>

                <div class="dataset-form-row">
                  <label class="dataset-form-label required">{{ siteContent.sections.dataRelease.portal.fields.dataFormatScale }}</label>
                  <div class="dataset-field-stack">
                    <div class="dataset-select-wrap">
                      <select
                        v-model="dataFormatSelection"
                        class="dataset-input dataset-select"
                        @change="handleDataFormatSelectionChange"
                      >
                        <option value="">Select format preset</option>
                        <option
                          v-for="format in siteContent.sections.dataRelease.portal.dataFormatOptions"
                          :key="`format-option-${format}`"
                          :value="format"
                        >
                          {{ format }}
                        </option>
                        <option :value="MANUAL_INPUT_VALUE">Manual input</option>
                      </select>
                    </div>
                    <input
                      v-if="dataFormatSelection === MANUAL_INPUT_VALUE"
                      v-model="datasetForm.dataFormatScale"
                      type="text"
                      class="dataset-input"
                      :placeholder="siteContent.sections.dataRelease.portal.placeholders.dataFormatScale"
                      @input="resetDatasetFieldCheck('dataFormatScale')"
                      @blur="validateRequiredTextField('dataFormatScale', 'Data Format & Scale')"
                    />
                    <p
                      v-if="datasetFieldChecks.dataFormatScale.message"
                      :class="['field-check-message', `is-${datasetFieldChecks.dataFormatScale.status}`]"
                    >
                      {{ datasetFieldChecks.dataFormatScale.message }}
                    </p>
                  </div>
                </div>

                <div class="dataset-form-row">
                  <label class="dataset-form-label required">{{ siteContent.sections.dataRelease.portal.fields.cloudStorageLink1 }}</label>
                  <div class="dataset-field-stack">
                    <div class="dataset-checkline">
                      <input
                        v-model="datasetForm.cloudStorageLink1"
                        type="text"
                        class="dataset-input"
                        :placeholder="siteContent.sections.dataRelease.portal.placeholders.cloudStorageLink1"
                        @input="resetCloudLinkCheck(0)"
                        @blur="handleCloudLinkBlur(0)"
                      />
                      <button type="button" class="pill-btn dataset-check-btn" @click="handleCloudLinkCheck(0)">
                        Check
                      </button>
                      <span :class="['field-check-icon', `is-${linkChecks[0].status}`]">{{ getCheckIcon(linkChecks[0].status) }}</span>
                    </div>
                    <p v-if="linkChecks[0].message" :class="['field-check-message', `is-${linkChecks[0].status}`]">{{ linkChecks[0].message }}</p>
                  </div>
                </div>

                <div class="dataset-form-row">
                  <label class="dataset-form-label">{{ siteContent.sections.dataRelease.portal.fields.cloudStorageLink2 }}</label>
                  <div class="dataset-field-stack">
                    <div class="dataset-checkline">
                      <input
                        v-model="datasetForm.cloudStorageLink2"
                        type="text"
                        class="dataset-input"
                        :placeholder="siteContent.sections.dataRelease.portal.placeholders.cloudStorageLink2"
                        @input="resetCloudLinkCheck(1)"
                        @blur="handleCloudLinkBlur(1)"
                      />
                      <button type="button" class="pill-btn dataset-check-btn" @click="handleCloudLinkCheck(1)">
                        Check
                      </button>
                      <span :class="['field-check-icon', `is-${linkChecks[1].status}`]">{{ getCheckIcon(linkChecks[1].status) }}</span>
                    </div>
                    <p v-if="linkChecks[1].message" :class="['field-check-message', `is-${linkChecks[1].status}`]">{{ linkChecks[1].message }}</p>
                    <p
                      v-if="datasetFieldChecks.cloudStorageLinks.message"
                      :class="['field-check-message', `is-${datasetFieldChecks.cloudStorageLinks.status}`]"
                    >
                      {{ datasetFieldChecks.cloudStorageLinks.message }}
                    </p>
                  </div>
                </div>
              </section>

              <section class="dataset-pane">
                <h3 class="dataset-pane-title">{{ siteContent.sections.dataRelease.portal.rightTitle }}</h3>

                <div class="dataset-form-row">
                  <label class="dataset-form-label required">{{ siteContent.sections.dataRelease.portal.fields.userEmail }}</label>
                  <div class="dataset-field-stack">
                    <div class="dataset-checkline">
                      <input
                        v-model="datasetForm.userEmail"
                        type="email"
                        class="dataset-input"
                        :placeholder="siteContent.sections.dataRelease.portal.placeholders.userEmail"
                        @input="resetEmailCheck"
                        @blur="validateUserEmail(true)"
                      />
                      <button type="button" class="pill-btn dataset-check-btn" @click="validateUserEmail(true)">
                        Check
                      </button>
                      <span :class="['field-check-icon', `is-${emailCheck.status}`]">{{ getCheckIcon(emailCheck.status) }}</span>
                    </div>
                    <p v-if="emailCheck.message" :class="['field-check-message', `is-${emailCheck.status}`]">{{ emailCheck.message }}</p>
                  </div>
                </div>

                <div class="dataset-form-row">
                  <label class="dataset-form-label required">{{ siteContent.sections.dataRelease.portal.fields.usageLicense }}</label>
                  <div class="dataset-field-stack">
                    <div class="dataset-select-wrap">
                      <select
                        v-model="usageLicenseSelection"
                        class="dataset-input dataset-select"
                        @change="handleUsageLicenseSelectionChange"
                      >
                        <option value="">Select license preset</option>
                        <option
                          v-for="license in siteContent.sections.dataRelease.portal.licenseOptions"
                          :key="`license-option-${license}`"
                          :value="license"
                        >
                          {{ license }}
                        </option>
                        <option :value="MANUAL_INPUT_VALUE">Manual input</option>
                      </select>
                    </div>
                    <input
                      v-if="usageLicenseSelection === MANUAL_INPUT_VALUE"
                      v-model="datasetForm.usageLicense"
                      type="text"
                      class="dataset-input"
                      placeholder="Type usage license"
                      @input="resetDatasetFieldCheck('usageLicense')"
                      @blur="validateRequiredTextField('usageLicense', 'Usage License')"
                    />
                    <p
                      v-if="datasetFieldChecks.usageLicense.message"
                      :class="['field-check-message', `is-${datasetFieldChecks.usageLicense.status}`]"
                    >
                      {{ datasetFieldChecks.usageLicense.message }}
                    </p>
                  </div>
                </div>

                <div class="dataset-form-row">
                  <label class="dataset-form-label required">{{ siteContent.sections.dataRelease.portal.fields.citationMethod }}</label>
                  <div class="dataset-field-stack">
                    <textarea
                      v-model="datasetForm.citationMethod"
                      class="dataset-textarea"
                      rows="3"
                      :placeholder="siteContent.sections.dataRelease.portal.placeholders.citationMethod"
                      @input="resetDatasetFieldCheck('citationMethod')"
                      @blur="validateRequiredTextField('citationMethod', 'Citation Method')"
                    />
                    <p
                      v-if="datasetFieldChecks.citationMethod.message"
                      :class="['field-check-message', `is-${datasetFieldChecks.citationMethod.status}`]"
                    >
                      {{ datasetFieldChecks.citationMethod.message }}
                    </p>
                  </div>
                </div>

                <div class="dataset-form-row">
                  <label class="dataset-form-label required">{{ siteContent.sections.dataRelease.portal.fields.uploadCoverImage }}</label>
                  <div class="dataset-upload-box">
                    <div v-if="datasetForm.coverImagePreview" class="dataset-upload-preview-wrap">
                      <img :src="datasetForm.coverImagePreview" alt="Uploaded preview" class="dataset-upload-preview" />
                    </div>
                    <div class="dataset-upload-actions">
                      <button
                        v-if="!datasetForm.coverImagePreview"
                        type="button"
                        class="pill-btn dataset-upload-btn"
                        @click="triggerCoverUpload"
                      >
                        {{ siteContent.sections.dataRelease.portal.uploadButtonText }}
                      </button>
                      <button
                        v-else
                        type="button"
                        class="pill-btn dataset-upload-btn"
                        @click="triggerCoverUpload"
                      >
                        {{ siteContent.sections.dataRelease.portal.reuploadButtonText }}
                      </button>
                    </div>
                    <input
                      ref="coverInputRef"
                      class="dataset-upload-input"
                      type="file"
                      accept=".jpg,.jpeg,.png,.gif,.bmp,.tiff,.tif"
                      @change="handleCoverChange"
                    />
                    <p class="dataset-upload-hint">
                      {{ datasetForm.coverImageName || siteContent.sections.dataRelease.portal.uploadHint }}
                    </p>
                    <p
                      v-if="datasetFieldChecks.coverImage.message"
                      :class="['field-check-message', `is-${datasetFieldChecks.coverImage.status}`]"
                    >
                      {{ datasetFieldChecks.coverImage.message }}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <div class="dataset-submit-actions">
              <button type="button" class="pill-btn dataset-reset-btn" @click="resetDatasetForm">
                {{ siteContent.sections.dataRelease.portal.resetText }}
              </button>
              <button type="submit" class="pill-btn dataset-submit-btn" :disabled="datasetSubmitting">
                {{ datasetSubmitting ? 'Submitting...' : siteContent.sections.dataRelease.portal.submitText }}
              </button>
            </div>
            <p class="dataset-submit-note">{{ siteContent.sections.dataRelease.portal.submitNote }}</p>
          </form>
        </div>
      </div>
    </Transition>

    <Transition name="dataset-validation-modal">
      <div v-if="datasetValidationVisible" class="dataset-validation-overlay" @click="closeDatasetValidationAlert">
        <div class="dataset-validation-card" @click.stop>
          <h3 class="dataset-validation-title">{{ datasetValidationTitle }}</h3>
          <p class="dataset-validation-desc">{{ datasetValidationDescription }}</p>
          <ul class="dataset-validation-list">
            <li v-for="(error, index) in datasetValidationErrors" :key="`dataset-submit-error-${index}`">
              {{ error }}
            </li>
          </ul>
          <div class="dataset-validation-actions">
            <button type="button" class="pill-btn dataset-validation-btn" @click="closeDatasetValidationAlert">
              OK
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="contact-modal">
      <div v-if="contactModalVisible" class="contact-overlay" @click="closeContactModal">
        <div class="contact-card" @click.stop>
          <h3 class="contact-title">{{ siteContent.sections.declaration.contactForm.title }}</h3>
          <form class="contact-form" @submit.prevent="submitContactForm">
            <label class="contact-label">
              {{ siteContent.sections.declaration.contactForm.fields.userEmail }}
            </label>
            <div class="contact-checkline">
              <input
                v-model="contactForm.userEmail"
                type="email"
                class="contact-input"
                :placeholder="siteContent.sections.declaration.contactForm.placeholders.userEmail"
                @input="resetContactEmailCheck"
                @blur="validateContactEmail(true)"
              />
              <button type="button" class="pill-btn contact-check-btn" @click="validateContactEmail(true)">
                Check
              </button>
              <span :class="['field-check-icon', `is-${contactEmailCheck.status}`]">{{ getCheckIcon(contactEmailCheck.status) }}</span>
            </div>
            <p v-if="contactEmailCheck.message" :class="['field-check-message', `is-${contactEmailCheck.status}`]">
              {{ contactEmailCheck.message }}
            </p>
            <label class="contact-label">
              {{ siteContent.sections.declaration.contactForm.fields.subject }}
            </label>
            <input
              v-model="contactForm.subject"
              type="text"
              class="contact-input"
              :placeholder="siteContent.sections.declaration.contactForm.placeholders.subject"
              @input="resetContactFieldCheck('subject')"
              @blur="validateContactRequiredField('subject', 'Title')"
            />
            <p v-if="contactFieldChecks.subject.message" :class="['field-check-message', `is-${contactFieldChecks.subject.status}`]">
              {{ contactFieldChecks.subject.message }}
            </p>
            <label class="contact-label">
              {{ siteContent.sections.declaration.contactForm.fields.content }}
            </label>
            <textarea
              v-model="contactForm.content"
              class="contact-textarea"
              rows="6"
              :placeholder="siteContent.sections.declaration.contactForm.placeholders.content"
              @input="resetContactFieldCheck('content')"
              @blur="validateContactRequiredField('content', 'Content')"
            />
            <p v-if="contactFieldChecks.content.message" :class="['field-check-message', `is-${contactFieldChecks.content.status}`]">
              {{ contactFieldChecks.content.message }}
            </p>
            <button type="submit" class="pill-btn contact-submit-btn" :disabled="contactSubmitting">
              {{ contactSubmitting ? 'Submitting...' : siteContent.sections.declaration.contactForm.submitText }}
            </button>
          </form>
        </div>
      </div>
    </Transition>

    <Transition name="media-preview-modal">
      <div v-if="originalPreviewVisible" class="original-media-overlay" @click="closeOriginalMediaPreview">
        <div class="original-media-card" @click.stop>
          <h3 class="original-media-title">
            {{ originalPreviewMedia.title || getOriginalPreviewTitle(originalPreviewMedia.type) }}
          </h3>
          <div class="original-media-stage">
            <div v-if="originalPreviewMedia.type === 'image'" class="original-media-image-wrap">
              <img
                v-if="originalPreviewMedia.src"
                :src="originalPreviewMedia.src"
                :alt="getOriginalPreviewTitle('image')"
                class="original-media-image"
                @load="handleOriginalImageLoaded"
                @error="handleOriginalImageError"
              />
              <div v-if="originalPreviewImageLoading" class="original-media-loading-panel">
                <p class="original-media-loading-title">Loading original image...</p>
                <div class="original-media-progress-track">
                  <span
                    class="original-media-progress-fill"
                    :style="{ width: getOriginalImageProgressPercentText() }"
                  />
                </div>
                <p class="original-media-progress-percent">{{ getOriginalImageProgressPercentText() }}</p>
                <p class="original-media-progress-details">{{ getOriginalImageProgressDetailsText() }}</p>
              </div>
              <p v-if="!originalPreviewImageLoading && originalPreviewImageError" class="original-media-load-error">
                {{ originalPreviewImageError }}
              </p>
            </div>
            <video
              v-else
              :src="originalPreviewMedia.src"
              class="original-media-video"
              controls
              playsinline
              preload="metadata"
            />
          </div>
          <div class="original-media-actions">
            <button
              type="button"
              class="pill-btn original-media-btn"
              :disabled="originalPreviewDownloading"
              @click="downloadOriginalMedia"
            >
              {{ originalPreviewDownloading ? 'Downloading...' : siteContent.meta.mediaPreviewActions.download }}
            </button>
            <a
              class="pill-btn original-media-btn"
              :href="originalPreviewMedia.previewUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ siteContent.meta.mediaPreviewActions.openInNewTab }}
            </a>
            <button type="button" class="pill-btn original-media-btn" @click="closeOriginalMediaPreview">
              {{ siteContent.meta.mediaPreviewActions.close }}
            </button>
          </div>
          <p v-if="originalPreviewDownloadError" class="original-media-download-error">
            {{ originalPreviewDownloadError }}
          </p>
        </div>
      </div>
    </Transition>

    <Transition name="fade-modal">
      <div v-if="comingSoonVisible" class="coming-soon-overlay" @click="closeComingSoon">
        <div class="coming-soon-card" @click.stop>
          {{ comingSoonMessage }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
:global(html) {
  zoom: 1.25;
  scrollbar-gutter: stable;
  background: #ffffff;
  overflow-x: hidden;
}

:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  background: #ffffff;
  color: #1d2738;
  font-family: 'Montserrat', 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

:global(body.modal-scroll-lock) {
  overflow: hidden;
  overscroll-behavior: none;
}

.app-root {
  --header-fixed-height: 82px;
  --surface: #ffffff;
  --surface-soft: #f5f7fa;
  --text-main: #162236;
  --text-muted: #42506a;
  --line: #ced8e6;
  --brand: #245ea8;
  --brand-strong: #1e4f90;
  --brand-soft: rgba(36, 94, 168, 0.14);
  --shadow-soft: 0 12px 30px rgba(18, 42, 77, 0.1);
  --performance-media-width: 100%;
  --result-video-top-width: 88%;
  --result-video-bottom-width: 88%;
  --content-media-width: var(--result-video-bottom-width);
  --result-video-top-gap: 14px;
  --result-video-top-item-width: 45%;
  --result-video-top-item-aspect-ratio: 16 / 5;
  --result-video-bottom-aspect-ratio: 1714 / 858;
  --result-video-1-scale: 1.1;
  --hero-video-scale: 1.28;
  --hero-video-object-position-x: 42%;
  --hero-video-shift-x: 0%;
  min-height: 100vh;
  color: var(--text-main);
}

.hero-gate-overlay {
  position: fixed;
  inset: 0;
  z-index: 95;
  background: #ffffff;
  display: grid;
  place-items: center;
}

.hero-gate-card {
  min-width: min(440px, 92vw);
  border: 1px solid #d6e1ef;
  border-radius: 14px;
  padding: 24px 26px;
  background: #f9fbff;
  box-shadow: 0 18px 34px rgba(20, 44, 79, 0.12);
  text-align: center;
}

.hero-gate-title {
  margin: 0;
  color: #1f406f;
  font-size: 16px;
  font-weight: 700;
}

.hero-gate-spinner {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 3px solid #c6d7ed;
  border-top-color: #285ea2;
  margin: 14px auto 0;
  animation: hero-spin 0.85s linear infinite;
}

@keyframes hero-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.shell {
  width: min(1140px, calc(100% - 28px));
  margin: 0 auto;
}

.page-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 40;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(102, 129, 173, 0.22);
}

.header-inner {
  min-height: 74px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  padding: 4px 0 4px 6px;
}

.header-inner.without-logo {
  justify-content: center;
}

.logo-box {
  position: relative;
  height: 68px;
  display: flex;
  align-items: center;
}

.logo-image {
  max-height: 56px;
  width: auto;
  display: block;
}

.header-title {
  margin: 0;
  position: static;
  transform: none;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.01em;
  white-space: normal;
  line-height: 1.1;
  color: #000000;
}

.page-main {
  padding: calc(var(--header-fixed-height) + 14px) 0 52px;
}

.first-screen {
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 24px;
  padding-top: 6px;
  padding-bottom: 0;
}

.first-screen > .shell {
  width: min(1220px, calc(100% - 72px));
}

.content-mid-backdrop {
  position: relative;
  margin-top: 26px;
  padding: 6px 0 34px;
}

.content-mid-backdrop::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: min(1150px, calc(100% - 18px));
  background: #f3f5f7;
  border-radius: 16px;
  z-index: 0;
}

.content-mid-backdrop > .shell {
  position: relative;
  z-index: 1;
}

.hero-section {
  display: grid;
  grid-template-columns: minmax(0, 58%) minmax(0, 42%);
  grid-template-rows: auto auto;
  column-gap: 40px;
  row-gap: 14px;
  align-items: start;
  padding: 0;
}

.focus-title {
  grid-column: 1;
  grid-row: 1;
  margin: 2px 0 10px;
  font-size: 32px;
  font-weight: 800;
  color: #333333;
  line-height: 1.1;
}

.hero-bullet-list {
  grid-column: 1;
  grid-row: 2;
  display: flex;
  flex-direction: column;
  width: min(80%, 520px);
  margin-right: auto;
  min-height: 0;
  height: auto;
  padding: 0;
  gap: 0;
  justify-content: space-between;
  align-self: start;
}

.arrow-group {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0;
  min-height: 0;
}

.arrow-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  margin-top: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.arrow-lines {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.line-text {
  margin: 0;
  font-size: 1rem;
  line-height: 1.56;
  font-weight: 400;
  color: #1a1a1a;
  text-align: justify;
  text-justify: inter-word;
  text-align-last: left;
  hyphens: auto;
  overflow-wrap: break-word;
  letter-spacing: 0.003em;
  word-spacing: 0.02em;
}

.hero-media-card {
  grid-column: 2;
  grid-row: 2;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
}

.hero-media-wrap {
  position: relative;
  margin-top: 0;
  width: 100%;
  aspect-ratio: 16 / 9;
  min-height: 0;
  height: auto !important;
  align-self: stretch;
  overflow: hidden;
}

.hero-video,
.section-video {
  width: 100%;
  display: block;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  outline: none;
}

.hero-video {
  background: transparent;
  object-fit: cover;
  object-position: var(--hero-video-object-position-x) center;
  position: absolute;
  inset: 0;
  height: 100%;
  transform: translateX(var(--hero-video-shift-x)) scale(var(--hero-video-scale));
  transform-origin: center center;
}

.section-video {
  background: #f4f7fb;
  object-fit: cover;
  cursor: pointer;
}

.section-video.is-click-to-load {
  border-style: none;
  border-color: transparent;
  background: linear-gradient(180deg, #eef4fc, #e4edf8);
}

.media-image {
  width: 100%;
  display: block;
  border: 0;
  border-radius: 0;
  background: transparent !important;
  mix-blend-mode: normal;
  object-fit: contain;
  height: auto;
  max-height: 560px;
  min-height: 0;
}

.performance-image {
  width: var(--content-media-width);
  margin: -4px auto 0;
  max-height: none;
}

.performance-image .media-image {
  max-height: none;
}

.nav-section {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  gap: 24px;
  margin: 8px auto 12px;
  padding: 0;
}

.pill-btn {
  border: 1px solid rgba(28, 77, 140, 0.24);
  border-radius: 999px;
  min-height: 42px;
  min-width: 140px;
  padding: 10px 32px;
  background: #8eaadc;
  color: rgb(0, 0, 0);
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease, background 0.2s ease;
  box-shadow: 0 8px 16px rgba(70, 98, 145, 0.22);
}

.pill-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 22px rgba(70, 98, 145, 0.28);
  filter: brightness(1.04);
}

.pill-btn:disabled {
  opacity: 0.64;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 4px 10px rgba(70, 98, 145, 0.14);
  filter: none;
}

.pill-btn.muted {
  background: #dee6f6;
  color: rgb(89, 89, 89);
}

.pill-btn-paper {
  background: #dee6f6;
  color: rgb(89, 89, 89);
}

.nav-section .pill-btn {
  width: auto;
  max-width: none;
}

.long-btn {
  min-width: 260px;
  width: auto;
}

.block-section {
  margin-top: 18px;
  padding: 0;
}

.section-title {
  margin: 0 0 14px;
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: clamp(20px, 2.05vw, 30px);
  line-height: 1.22;
  color: var(--text-main);
  font-weight: 800;
  letter-spacing: 0.008em;
}

.title-mark {
  width: 24px;
  height: 24px;
  display: inline-grid;
  place-items: center;
  border-radius: 6px;
  background: var(--brand-soft);
  color: var(--brand-strong);
  font-size: 14px;
  line-height: 1;
}

.panel-card {
  background: transparent;
  border: 0;
  border-radius: 0;
  padding: 0;
}

.panel-card.compact {
  margin-top: 14px;
}

.panel-title,
.panel-subtitle,
.sub-panel-title {
  margin: 0 0 6px;
  text-align: center;
  font-size: clamp(16px, 1.45vw, 24px);
  line-height: 1.32;
  font-weight: 700;
  color: #22324a;
  width: var(--content-media-width);
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.sub-panel-title {
  margin-bottom: 14px;
}

.panel-subtitle {
  font-size: clamp(16px, 1.3vw, 21px);
}

.panel-note {
  margin: 8px 0 0;
  font-size: 1rem;
  line-height: 1.56;
  font-weight: 400;
  color: #1a1a1a;
}

.panel-note-row {
  width: var(--content-media-width);
  max-width: 100%;
  margin: 2px auto 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.panel-note-inline {
  margin: 0;
}

.light-panel {
  background: transparent;
}

.video-grid-top {
  display: flex;
  gap: var(--result-video-top-gap);
  width: var(--result-video-top-width);
  margin: 0 auto;
  justify-content: space-between;
}

.video-card {
  position: relative;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.video-card-wide {
  margin-top: clamp(18px, 1.9vw, 26px);
  width: var(--result-video-bottom-width);
  margin-left: auto;
  margin-right: auto;
}

.video-card-result_video_1 {
  flex: 0 0 var(--result-video-top-item-width);
}

.video-card-result_video_2 {
  flex: 0 0 var(--result-video-top-item-width);
}

.video-media-frame {
  position: relative;
  width: 100%;
  overflow: hidden;
  border: 0 !important;
  outline: none !important;
  box-shadow: none !important;
  background: transparent;
}

.video-card-result_video_1 .video-media-frame,
.video-card-result_video_2 .video-media-frame {
  aspect-ratio: var(--result-video-top-item-aspect-ratio);
}

.video-card-result_video_3 .video-media-frame {
  aspect-ratio: var(--result-video-bottom-aspect-ratio);
}

.video-card .section-video,
.video-card-wide .section-video {
  height: 100%;
  min-height: 0;
  border: 0 !important;
  outline: none !important;
  box-shadow: none !important;
}

.video-card .section-video:focus,
.video-card .section-video:focus-visible,
.video-card-wide .section-video:focus,
.video-card-wide .section-video:focus-visible,
.tutorial-video:focus,
.tutorial-video:focus-visible,
.hero-video:focus,
.hero-video:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}

.result-video-1-zoom {
  transform: scale(var(--result-video-1-scale));
  transform-origin: left center;
}

.dataset-layout {
  display: grid;
  grid-template-columns: minmax(0, 45%) minmax(320px, 55%);
  gap: 18px;
  align-items: start;
}

.dataset-text,
.intro-lines {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.text-rect {
  width: 100%;
}

.dataset-text {
  max-width: 90%;
  margin-right: auto;
  justify-content: flex-start;
}

.dataset-text p {
  flex: 0 0 auto;
  line-height: 1.68;
}

.dataset-text p,
.intro-lines p,
.tutorial-item p,
.declaration-text {
  margin: 0;
  font-size: 1rem;
  line-height: 1.56;
  font-weight: 400;
  color: #1a1a1a;
  text-align: justify;
  text-justify: inter-word;
  hyphens: auto;
  overflow-wrap: break-word;
  letter-spacing: 0.003em;
  word-spacing: 0.02em;
}

.dataset-card {
  display: grid;
  grid-template-rows: auto auto auto auto;
  align-items: start;
  gap: 5px;
  background: transparent;
  border: 0;
  border-radius: 0;
  padding: 0;
}

.dataset-card-title {
  margin: 0 auto 8px;
  font-size: clamp(13px, 1.02vw, 17px);
  width: min(66%, 420px);
  max-width: 100%;
  text-align: center;
}

.dataset-image {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dataset-image .media-image {
  max-height: min(220px, 32vh);
  width: 100%;
  object-fit: contain;
}

.dataset-label-row {
  margin-top: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: clamp(8px, 1.1vw, 14px);
  width: min(66%, 420px);
  margin-left: auto;
  margin-right: auto;
  color: #4f5d73;
  font-size: clamp(10px, 0.78vw, 13px);
  text-align: center;
}

.dataset-btn-row {
  margin-top: 2px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: clamp(8px, 1.1vw, 14px);
  width: min(66%, 420px);
  margin-left: auto;
  margin-right: auto;
}

.dataset-label-row span,
.dataset-btn-row .pill-btn {
  width: 100%;
}

.dataset-label-row span:nth-child(2),
.dataset-btn-row .pill-btn:nth-child(2) {
  transform: none;
}

.dataset-label-row span:first-child,
.dataset-btn-row .pill-btn:first-child {
  transform: translateX(-20px);
}

.dataset-card > .progressive-image-wrap {
  width: min(66%, 420px);
}

.dataset-btn-row .pill-btn {
  min-height: 34px;
  font-size: clamp(10px, 0.76vw, 12px);
  padding: 0 8px;
}

.tutorial-layout {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(260px, 1.7fr);
  gap: 16px;
  align-items: stretch;
}

.tutorial-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  padding-left: 33px;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.tutorial-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.tutorial-marker {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  margin-top: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tutorial-media {
  position: relative;
  width: 88%;
  margin-left: auto;
  display: flex;
  flex-direction: column;
}

.tutorial-media-frame {
  aspect-ratio: 1750 / 932;
}

.tutorial-media .tutorial-video {
  height: 100%;
  width: 100%;
  min-height: 0;
}

.tutorial-layout .tutorial-list {
  min-height: 0;
}

.section-cta {
  margin-top: 18px;
}

.media-action-row {
  margin: 6px 0 0;
  display: flex;
  justify-content: flex-end;
}

.media-action-row-video {
  margin-top: 8px;
  width: 100%;
}

.media-action-row-image {
  margin-top: 2px;
  width: var(--content-media-width);
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.media-action-row-inline {
  margin: 0;
  width: auto;
}

.performance-action-row {
  margin-top: clamp(4px, 0.7vw, 10px);
  position: relative;
  z-index: 3;
}

.hero-video-action-row,
.result-video-action-row,
.tutorial-video-action-row {
  margin-top: 8px;
}

.media-download-link {
  color: #1a4f95;
  text-decoration: none;
  font-weight: 800;
  font-size: 13px;
  line-height: 1.2;
}

.media-download-link:hover {
  text-decoration: underline;
}

.media-preview-trigger {
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
}

.media-download-overlay {
  position: absolute;
  right: 10px;
  bottom: 8px;
  z-index: 2;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.media-download-overlay.media-download-link {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.progressive-image-wrap {
  position: relative;
  width: 100%;
}

.panel-card > .progressive-image-wrap {
  width: var(--content-media-width);
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
}

/* Keep all large images at the same width as the Integrated circuit baseline. */
.panel-card > .progressive-image-wrap .media-image {
  width: 100%;
  height: auto;
  max-height: none;
  object-fit: contain;
}

.dataset-card > .progressive-image-wrap {
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.progressive-image-placeholder {
  position: relative;
  z-index: 1;
}

.progressive-image-wrap.is-loaded .progressive-image-placeholder {
  display: none;
}

.progressive-image-final {
  position: absolute;
  inset: 0;
  z-index: 2;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease;
}

.progressive-image-final-force-visible {
  opacity: 1;
  visibility: visible;
}

.progressive-image-final.is-loaded {
  position: relative;
  inset: auto;
  opacity: 1;
  visibility: visible;
}

.title-aligned-section > :not(.section-title) {
  margin-left: 33px;
  width: calc(100% - 33px);
}

.balanced-text-section > :not(.section-title) {
  margin-left: 33px;
  margin-right: 33px;
  width: calc(100% - 66px);
}

.balanced-text-section .section-title {
  margin-left: 33px;
  margin-right: 33px;
  width: calc(100% - 66px);
}

.section-cta-wide {
  width: 100%;
}

.ext-large-image {
  max-height: none;
  width: var(--content-media-width);
  min-height: 0;
}

.ext-large-image .media-image {
  max-height: none;
}

/* Keep Underwater drone left edge aligned with peers, and expand only on the right by 20px. */
.panel-card > .progressive-image-wrap.ext-underwater-expand-right {
  width: calc(var(--content-media-width) + 20px);
  max-width: calc(100% + 20px);
  margin-left: calc((100% - var(--content-media-width)) / 2 - 10px);
  margin-right: auto;
  overflow: visible;
}

.panel-card > .progressive-image-wrap.ext-underwater-expand-right .media-image {
  display: block;
  width: 100%;
  height: auto;
  max-width: none;
  object-position: left center;
}

.original-media-overlay {
  position: fixed;
  inset: 0;
  z-index: 97;
  background: rgba(18, 31, 52, 0.58);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.original-media-card {
  width: min(1240px, 96vw);
  max-height: 90vh;
  background: #f8fbff;
  border: 1px solid rgba(73, 111, 169, 0.32);
  box-shadow: 0 20px 48px rgba(14, 35, 68, 0.3);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.original-media-title {
  margin: 0;
  padding: 14px 18px;
  font-size: clamp(16px, 1.25vw, 22px);
  color: #183154;
  background: linear-gradient(180deg, rgba(139, 174, 223, 0.28), rgba(139, 174, 223, 0));
  border-bottom: 1px solid rgba(73, 111, 169, 0.24);
}

.original-media-stage {
  padding: 14px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  overflow: auto;
}

.original-media-image-wrap {
  position: relative;
  min-width: min(100%, 440px);
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.original-media-loading-panel {
  position: absolute;
  inset: 0;
  background: rgba(249, 252, 255, 0.94);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  text-align: center;
}

.original-media-loading-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1f3457;
}

.original-media-progress-track {
  width: min(560px, 88%);
  height: 12px;
  border-radius: 999px;
  background: #dce8f8;
  overflow: hidden;
  border: 1px solid #c1d4ef;
}

.original-media-progress-fill {
  display: block;
  height: 100%;
  width: 0;
  background: linear-gradient(90deg, #5a83c4 0%, #79a2df 100%);
  transition: width 0.18s linear;
}

.original-media-progress-percent {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #1d3963;
}

.original-media-progress-details {
  margin: 0;
  font-size: 13px;
  color: #34527d;
}

.original-media-load-error {
  margin: 0;
  font-size: 13px;
  color: #b03f3f;
  font-weight: 600;
  text-align: center;
  padding: 10px 14px;
}

.original-media-image,
.original-media-video {
  max-width: 100%;
  max-height: calc(90vh - 210px);
  width: auto;
  height: auto;
  border: 1px solid var(--line);
}

.original-media-image {
  background: transparent;
}

.original-media-video {
  background: #000;
}

.original-media-actions {
  padding: 12px 14px 14px;
  border-top: 1px solid rgba(73, 111, 169, 0.22);
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
  background: #f7fbff;
}

.original-media-btn {
  min-height: 38px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.original-media-download-error {
  margin: 0;
  padding: 0 14px 12px;
  font-size: 13px;
  line-height: 1.4;
  color: #b03f3f;
  font-weight: 600;
}

.declaration-text {
  margin-bottom: 10px;
}

.contact-inline-link {
  border: 0;
  background: transparent;
  padding: 0;
  margin: 0 2px;
  color: #1f67cf;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.contact-inline-link:hover {
  text-decoration: underline;
}

.declaration-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.declaration-link {
  color: #2e66c5;
  text-decoration: none;
  font-weight: 700;
}

.declaration-link:hover {
  text-decoration: underline;
}

.anchor-block {
  scroll-margin-top: 104px;
}

.dataset-submit-overlay {
  position: fixed;
  inset: 0;
  z-index: 81;
  background: rgba(23, 43, 74, 0.38);
  display: grid;
  place-items: center;
  padding: 22px;
}

.dataset-submit-card {
  width: min(980px, 90vw);
  max-height: min(680px, 74vh);
  overflow: auto;
  border-radius: 18px;
  border: 1px solid rgba(117, 152, 206, 0.4);
  background: linear-gradient(180deg, rgba(243, 248, 255, 0.96), rgba(236, 244, 255, 0.95));
  box-shadow: 0 24px 54px rgba(16, 37, 71, 0.28);
  padding: 18px 20px 16px;
}

.dataset-submit-title {
  margin: 0;
  text-align: center;
  color: #1e3e79;
  font-size: clamp(24px, 2vw, 34px);
  font-weight: 800;
  line-height: 1.15;
}

.dataset-submit-subtitle {
  margin: 10px 0 8px;
  text-align: center;
  color: #2c405f;
  font-size: 16px;
  font-weight: 600;
}

.dataset-submit-track-row {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.dataset-submit-track-tag {
  border: 1px solid rgba(114, 166, 220, 0.42);
  background: rgba(222, 239, 255, 0.88);
  color: #23548f;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  padding: 3px 11px;
}

.dataset-submit-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dataset-submit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.dataset-pane {
  border: 1px solid rgba(164, 188, 224, 0.56);
  background: rgba(255, 255, 255, 0.88);
  border-radius: 14px;
  padding: 14px 14px 12px;
}

.dataset-pane-title {
  margin: 0 0 10px;
  font-size: 20px;
  font-weight: 800;
  color: #244273;
}

.dataset-form-row {
  display: grid;
  grid-template-columns: 150px 1fr;
  align-items: start;
  gap: 10px;
  margin-bottom: 12px;
}

.dataset-form-label {
  padding-top: 8px;
  font-size: 15px;
  font-weight: 700;
  color: #2b3e5d;
  line-height: 1.3;
}

.dataset-form-label.required::before {
  content: '*';
  color: #f15b2a;
  margin-right: 5px;
}

.dataset-input,
.dataset-textarea {
  width: 100%;
  border: 1px solid rgba(151, 176, 213, 0.62);
  background: rgba(255, 255, 255, 0.98);
  color: #24324a;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  line-height: 1.4;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.dataset-input:focus,
.dataset-textarea:focus {
  border-color: #5c8dd1;
  box-shadow: 0 0 0 2px rgba(92, 141, 209, 0.18);
}

.dataset-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  cursor: pointer;
  padding-right: 34px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(245, 251, 255, 0.96));
}

.dataset-select-wrap {
  position: relative;
}

.dataset-select-wrap::after {
  content: '';
  position: absolute;
  right: 12px;
  top: 50%;
  width: 8px;
  height: 8px;
  border-right: 2px solid #4d6f9f;
  border-bottom: 2px solid #4d6f9f;
  transform: translateY(-62%) rotate(45deg);
  pointer-events: none;
}

.dataset-textarea {
  min-height: 76px;
  resize: vertical;
}

.dataset-field-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dataset-checkline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 22px;
  align-items: center;
  gap: 8px;
}

.dataset-check-btn {
  min-height: 36px;
  min-width: 84px;
  padding: 0 12px;
  font-size: 13px;
}

.field-check-icon {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 1px solid rgba(123, 146, 182, 0.4);
  font-size: 12px;
  font-weight: 900;
  color: #6f8099;
  background: rgba(255, 255, 255, 0.8);
}

.field-check-icon.is-valid {
  color: #1f7a35;
  border-color: rgba(38, 146, 69, 0.5);
  background: rgba(224, 246, 228, 0.9);
}

.field-check-icon.is-invalid {
  color: #a12e2e;
  border-color: rgba(190, 73, 73, 0.5);
  background: rgba(253, 231, 231, 0.9);
}

.field-check-icon.is-checking {
  color: #38558a;
  border-color: rgba(80, 121, 186, 0.5);
  background: rgba(232, 241, 255, 0.9);
}

.field-check-message {
  margin: 0;
  font-size: 12px;
  line-height: 1.35;
  color: #556882;
}

.field-check-message.is-valid {
  color: #1f7a35;
}

.field-check-message.is-invalid {
  color: #a12e2e;
}

.field-check-message.is-checking {
  color: #38558a;
}

.dataset-upload-box {
  border: 1px dashed rgba(130, 162, 208, 0.7);
  border-radius: 10px;
  background: rgba(246, 250, 255, 0.95);
  padding: 10px;
}

.dataset-upload-preview-wrap {
  width: 100%;
  margin-bottom: 8px;
}

.dataset-upload-preview {
  width: 100%;
  max-height: 180px;
  display: block;
  object-fit: contain;
  border: 1px solid rgba(151, 176, 213, 0.52);
  border-radius: 8px;
  background: #fff;
}

.dataset-upload-actions {
  display: flex;
  align-items: center;
}

.dataset-upload-btn {
  min-height: 40px;
  min-width: 128px;
  border-radius: 999px;
}

.dataset-upload-input {
  display: none;
}

.dataset-upload-hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: #4c6289;
}

.dataset-submit-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.dataset-reset-btn {
  min-width: 132px;
  font-size: 16px;
}

.dataset-submit-btn {
  min-width: 180px;
  font-size: 18px;
}

.dataset-submit-note {
  margin: 0;
  text-align: center;
  font-size: 15px;
  color: #32476b;
}

.dataset-form-modal-enter-active,
.dataset-form-modal-leave-active {
  transition: opacity 0.28s ease;
}

.dataset-form-modal-enter-active .dataset-submit-card,
.dataset-form-modal-leave-active .dataset-submit-card {
  transition: transform 0.28s ease, opacity 0.28s ease;
}

.dataset-form-modal-enter-from,
.dataset-form-modal-leave-to {
  opacity: 0;
}

.dataset-form-modal-enter-from .dataset-submit-card,
.dataset-form-modal-leave-to .dataset-submit-card {
  opacity: 0;
  transform: translateY(10px) scale(0.985);
}

.dataset-validation-overlay {
  position: fixed;
  inset: 0;
  z-index: 83;
  background: rgba(18, 34, 59, 0.42);
  display: grid;
  place-items: center;
  padding: 18px;
}

.dataset-validation-card {
  width: min(680px, 94vw);
  border-radius: 16px;
  border: 1px solid rgba(116, 154, 214, 0.5);
  background: linear-gradient(180deg, rgba(244, 250, 255, 0.97), rgba(236, 245, 255, 0.96));
  box-shadow: 0 20px 44px rgba(15, 35, 67, 0.28);
  padding: 18px 18px 16px;
}

.dataset-validation-title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: #234679;
  text-align: center;
}

.dataset-validation-desc {
  margin: 8px 0 10px;
  font-size: 15px;
  color: #324a6f;
  text-align: center;
}

.dataset-validation-list {
  margin: 0;
  padding-left: 18px;
  color: #2b3f5f;
  font-size: 14px;
  line-height: 1.42;
}

.dataset-validation-list li + li {
  margin-top: 6px;
}

.dataset-validation-actions {
  margin-top: 14px;
  display: flex;
  justify-content: center;
}

.dataset-validation-btn {
  min-width: 140px;
}

.dataset-validation-modal-enter-active,
.dataset-validation-modal-leave-active {
  transition: opacity 0.22s ease;
}

.dataset-validation-modal-enter-active .dataset-validation-card,
.dataset-validation-modal-leave-active .dataset-validation-card {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.dataset-validation-modal-enter-from,
.dataset-validation-modal-leave-to {
  opacity: 0;
}

.dataset-validation-modal-enter-from .dataset-validation-card,
.dataset-validation-modal-leave-to .dataset-validation-card {
  opacity: 0;
  transform: translateY(8px) scale(0.985);
}

.contact-overlay {
  position: fixed;
  inset: 0;
  z-index: 82;
  background: rgba(15, 31, 56, 0.36);
  display: grid;
  place-items: center;
  padding: 16px;
}

.contact-card {
  width: min(560px, 94vw);
  border-radius: 14px;
  border: 1px solid rgba(106, 142, 197, 0.45);
  background: linear-gradient(180deg, rgba(246, 251, 255, 0.95), rgba(236, 245, 255, 0.94));
  box-shadow: 0 22px 46px rgba(18, 41, 76, 0.24);
  padding: 18px 18px 16px;
}

.contact-title {
  margin: 0 0 12px;
  font-size: 22px;
  font-weight: 800;
  color: #244576;
  text-align: center;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contact-label {
  font-size: 14px;
  font-weight: 700;
  color: #2a3f61;
}

.contact-input,
.contact-textarea {
  width: 100%;
  border: 1px solid rgba(141, 169, 209, 0.68);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.98);
  color: #22324a;
  padding: 9px 10px;
  font-size: 14px;
  line-height: 1.4;
  outline: none;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.contact-input:focus,
.contact-textarea:focus {
  border-color: #5c8dd1;
  box-shadow: 0 0 0 2px rgba(92, 141, 209, 0.18);
}

.contact-checkline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 22px;
  align-items: center;
  gap: 8px;
}

.contact-check-btn {
  min-height: 34px;
  min-width: 84px;
  padding: 0 12px;
  font-size: 13px;
}

.contact-textarea {
  resize: vertical;
}

.contact-submit-btn {
  margin-top: 6px;
  align-self: center;
  min-width: 148px;
  font-size: 18px;
}

.contact-modal-enter-active,
.contact-modal-leave-active {
  transition: opacity 0.24s ease;
}

.contact-modal-enter-active .contact-card,
.contact-modal-leave-active .contact-card {
  transition: transform 0.24s ease, opacity 0.24s ease;
}

.contact-modal-enter-from,
.contact-modal-leave-to {
  opacity: 0;
}

.contact-modal-enter-from .contact-card,
.contact-modal-leave-to .contact-card {
  opacity: 0;
  transform: translateY(8px) scale(0.985);
}

.coming-soon-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(14, 25, 41, 0.28);
  display: grid;
  place-items: center;
  padding: 16px;
}

.coming-soon-card {
  min-width: min(340px, 90vw);
  background: linear-gradient(140deg, rgba(255, 255, 255, 0.72), rgba(235, 245, 255, 0.68));
  border: 1px solid rgba(79, 116, 177, 0.42);
  border-radius: 14px;
  padding: 20px 26px;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: #193151;
  box-shadow: 0 16px 36px rgba(20, 43, 77, 0.22);
  backdrop-filter: blur(8px);
}

.fade-modal-enter-active,
.fade-modal-leave-active {
  transition: opacity 0.28s ease;
}

.fade-modal-enter-active .coming-soon-card,
.fade-modal-leave-active .coming-soon-card {
  transition: transform 0.28s ease, opacity 0.28s ease;
}

.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
}

.fade-modal-enter-from .coming-soon-card,
.fade-modal-leave-to .coming-soon-card {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

@media (max-width: 980px) {
  .app-root {
    --header-fixed-height: 68px;
    --performance-media-width: 100%;
    --result-video-top-width: 100%;
    --result-video-bottom-width: 100%;
    --content-media-width: 100%;
    --result-video-top-item-width: 100%;
    --result-video-1-scale: 1.02;
    --hero-video-scale: 1.2;
    --hero-video-object-position-x: 44%;
    --hero-video-shift-x: 0%;
  }

  .header-inner {
    min-height: 60px;
    gap: 8px;
    padding-left: 2px;
  }

  .logo-box {
    height: 52px;
  }

  .logo-image {
    max-height: 44px;
  }

  .header-title {
    font-size: clamp(16px, 2.8vw, 20px);
    white-space: normal;
  }

  .hero-section {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 0;
  }

  .hero-bullet-list {
    width: 100%;
    min-height: 0;
    height: auto;
    gap: 14px;
    justify-content: flex-start;
    align-self: start;
  }

  .first-screen {
    min-height: auto;
    gap: 16px;
  }

  .first-screen > .shell {
    width: min(1140px, calc(100% - 24px));
  }

  .hero-media-wrap {
    margin-top: 0;
    height: auto !important;
    min-height: 0;
    aspect-ratio: 16 / 9;
  }

  .hero-media-card {
    grid-column: 1;
    grid-row: 3;
  }

  .nav-section {
    justify-content: center;
    flex-wrap: wrap;
    margin: 12px auto 16px;
  }

  .nav-section .pill-btn {
    width: clamp(120px, 42vw, 180px);
    min-width: clamp(120px, 42vw, 180px);
    max-width: clamp(120px, 42vw, 180px);
  }

  .section-title {
    font-size: clamp(19px, 4.3vw, 27px);
  }

  .line-text,
  .dataset-text p,
  .intro-lines p,
  .tutorial-item p,
  .declaration-text {
    font-size: 1rem;
  }

  .tutorial-layout .tutorial-list {
    min-height: 0;
  }

  .dataset-layout,
  .tutorial-layout {
    grid-template-columns: 1fr;
  }

  .title-aligned-section > :not(.section-title) {
    margin-left: 0;
    width: 100%;
  }

  .balanced-text-section > :not(.section-title) {
    margin-left: 0;
    margin-right: 0;
    width: 100%;
  }

  .balanced-text-section .section-title {
    margin-left: 0;
    margin-right: 0;
    width: 100%;
  }

  .dataset-text,
  .tutorial-media,
  .performance-image {
    width: 100%;
    max-width: 100%;
  }

  .content-mid-backdrop::before {
    width: min(1150px, calc(100% - 10px));
  }

  .original-media-overlay {
    padding: 12px;
  }

  .original-media-card {
    width: 100%;
    max-height: 92vh;
  }

  .original-media-actions {
    justify-content: stretch;
  }

  .original-media-btn {
    width: 100%;
  }

  .dataset-label-row,
  .dataset-btn-row {
    transform: none;
    z-index: auto;
  }

  .panel-note-row {
    width: 100%;
  }

  .video-grid-top {
    flex-direction: column;
  }

  .dataset-submit-card {
    width: min(900px, 95vw);
    max-height: min(640px, 72vh);
    padding: 18px 14px 14px;
  }

  .dataset-submit-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .dataset-form-row {
    grid-template-columns: 1fr;
    gap: 6px;
    margin-bottom: 9px;
  }

  .dataset-form-label {
    padding-top: 0;
  }

  .dataset-checkline {
    grid-template-columns: minmax(0, 1fr) auto 20px;
  }

  .dataset-check-btn {
    min-width: 72px;
    min-height: 34px;
    font-size: 12px;
    padding: 0 10px;
  }

  .contact-checkline {
    grid-template-columns: minmax(0, 1fr) auto 20px;
  }

  .contact-check-btn {
    min-width: 72px;
    min-height: 34px;
    font-size: 12px;
    padding: 0 10px;
  }

  .field-check-icon {
    width: 20px;
    height: 20px;
    font-size: 11px;
  }
}

@media (max-width: 680px) {
  .shell {
    width: min(1140px, calc(100% - 18px));
  }

  .page-main {
    padding-top: calc(var(--header-fixed-height) + 12px);
  }

  .first-screen > .shell {
    width: min(1140px, calc(100% - 18px));
  }

  .nav-section {
    gap: 10px;
    padding: 0;
  }

  .nav-section .pill-btn {
    width: calc(50% - 6px);
    min-width: calc(50% - 6px);
    max-width: calc(50% - 6px);
  }

  .pill-btn {
    min-height: 40px;
    font-size: 13px;
  }

  .coming-soon-card {
    min-width: min(300px, 92vw);
    font-size: 16px;
  }

  .dataset-submit-title {
    font-size: clamp(21px, 5.6vw, 28px);
  }

  .dataset-submit-subtitle {
    font-size: 14px;
  }

  .dataset-pane-title {
    font-size: 20px;
  }

  .dataset-submit-btn {
    min-width: 190px;
    font-size: 22px;
  }

  .dataset-submit-note {
    font-size: 16px;
  }

  .contact-title {
    font-size: 20px;
  }

  .contact-submit-btn {
    min-width: 132px;
    font-size: 18px;
  }
}
</style>
