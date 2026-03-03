export const submissionMailConfig = {
  senderEmail: 'm15754335963@163.com',
  targetEmail: '2401284861@qq.com',
  smtp: {
    host: 'smtp.163.com',
    port: 465,
    secure: true,
    authToken: 'XNWTgfQSKxE8k6Zb',
  },
  provider: {
    name: 'emailjs',
    endpoint: 'https://api.emailjs.com/api/v1.0/email/send',
    serviceId: 'YOUR_EMAILJS_SERVICE_ID',
    templateId: 'YOUR_EMAILJS_TEMPLATE_ID',
    publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
    privateKey: '',
    timeoutMs: 12000,
  },
  rateLimit: {
    dailyPerEmail: 5,
    monthlyPerEmail: 10,
    storageKey: 'focus_framework_submission_mail_rate_map_v1',
  },
  messages: {
    validationTitle: 'Submission blocked',
    validationDescription: 'Please fix the following issues before submitting:',
    contactValidationDescription: 'Please fix the following contact form issues:',
    deliveryFailedTitle: 'Email delivery failed',
    datasetDeliveryFailedDescription: 'Submission was blocked because the email could not be delivered.',
    contactDeliveryFailedDescription: 'Contact submission failed because the email could not be delivered.',
    mailConfigMissing:
      'Mail service is not configured yet. Please fill serviceId, templateId and publicKey in src/config/submissionMailConfig.js.',
    mailSendFailedPrefix: 'Mail sending failed: ',
    mailSendNetworkError: 'Network request failed or blocked by CORS.',
    rateLimitDaily: 'Daily limit exceeded for this email address (5/day).',
    rateLimitMonthly: 'Monthly limit exceeded for this email address (10/month).',
    datasetSuccess: 'Dataset submission email has been sent successfully.',
    contactSuccess: 'Contact email has been sent successfully.',
  },
  failureAlerts: {
    default: {
      title: 'Email delivery failed',
      description: 'The submission could not be delivered due to an unexpected error.',
      hint: 'Please retry in a few minutes. If it still fails, contact the administrator.',
    },
    rate_limit_daily: {
      title: 'Daily sending limit reached',
      description: 'This email address has reached the daily sending quota.',
      hint: 'You can submit again tomorrow (daily limit: 5, shared by dataset + contact submissions).',
    },
    rate_limit_monthly: {
      title: 'Monthly sending limit reached',
      description: 'This email address has reached the monthly sending quota.',
      hint: 'You can submit again next month (monthly limit: 10, shared by dataset + contact submissions).',
    },
    provider_not_configured: {
      title: 'Mail service not configured',
      description: 'The mail provider settings are incomplete.',
      hint: 'Fill serviceId/templateId/publicKey in src/config/submissionMailConfig.js.',
    },
    request_timeout: {
      title: 'Mail request timed out',
      description: 'The mail service request timed out before completion.',
      hint: 'Please check network quality and retry.',
    },
    network_or_cors: {
      title: 'Network or CORS blocked',
      description: 'The browser could not reach the mail provider endpoint.',
      hint: 'Check network access, browser privacy plugins, and provider CORS whitelist.',
    },
    provider_http_400: {
      title: 'Invalid mail request (400)',
      description: 'The mail provider rejected request parameters.',
      hint: 'Check template variable names and payload format.',
    },
    provider_http_401: {
      title: 'Authentication failed (401)',
      description: 'Mail provider authentication failed.',
      hint: 'Check public key/private key and account binding.',
    },
    provider_http_403: {
      title: 'Permission denied (403)',
      description: 'The mail provider denied this request origin or credential.',
      hint: 'Check domain whitelist and service permissions.',
    },
    provider_http_404: {
      title: 'Mail API endpoint not found (404)',
      description: 'The configured endpoint or template/service was not found.',
      hint: 'Check endpoint URL, serviceId and templateId.',
    },
    provider_http_408: {
      title: 'Mail provider timeout (408)',
      description: 'The provider timed out while processing the request.',
      hint: 'Retry later or reduce payload size.',
    },
    provider_http_413: {
      title: 'Payload too large (413)',
      description: 'The email payload is too large for provider limits.',
      hint: 'Reduce image size or use external image URL instead of inline base64.',
    },
    provider_http_415: {
      title: 'Unsupported media type (415)',
      description: 'The provider does not accept current content type.',
      hint: 'Ensure request Content-Type is application/json.',
    },
    provider_http_422: {
      title: 'Validation failed (422)',
      description: 'The provider reported semantic validation errors.',
      hint: 'Check required template fields and value formats.',
    },
    provider_http_429: {
      title: 'Provider rate limited (429)',
      description: 'The mail provider throttled the request.',
      hint: 'Wait and retry later, or upgrade provider quota.',
    },
    provider_http_500: {
      title: 'Provider internal error (500)',
      description: 'The mail provider encountered an internal error.',
      hint: 'Retry later. If persistent, contact provider support.',
    },
    provider_http_502: {
      title: 'Provider bad gateway (502)',
      description: 'Provider gateway returned an invalid upstream response.',
      hint: 'Retry later.',
    },
    provider_http_503: {
      title: 'Provider unavailable (503)',
      description: 'Mail provider service is temporarily unavailable.',
      hint: 'Retry later.',
    },
    provider_http_504: {
      title: 'Provider gateway timeout (504)',
      description: 'Provider gateway timed out.',
      hint: 'Retry later.',
    },
    provider_http_other: {
      title: 'Provider returned an error status',
      description: 'The provider returned a non-success HTTP status.',
      hint: 'Check HTTP status code and provider message details.',
    },
  },
  templates: {
    subjectPrefix: '[Focus Framework]',
    datasetTitle: 'Dataset Submission',
    contactTitle: 'Contact Us Submission',
    htmlStyles: `
        body{margin:0;padding:0;background:#f4f8ff;font-family:Segoe UI,Arial,sans-serif;color:#1f3558;}
        .mail-wrap{max-width:860px;margin:0 auto;padding:22px 14px;}
        .mail-card{background:#ffffff;border:1px solid #d8e4f7;border-radius:14px;overflow:hidden;box-shadow:0 10px 28px rgba(22,45,82,.12);}
        .mail-head{padding:18px 22px;background:linear-gradient(120deg,#e8f1ff,#f5f9ff);border-bottom:1px solid #d8e4f7;}
        .mail-title{margin:0;font-size:24px;line-height:1.2;color:#1f4f8f;font-weight:800;}
        .mail-sub{margin:7px 0 0;font-size:13px;color:#3e587a;}
        .mail-body{padding:18px 22px 20px;}
        .section-title{margin:0 0 10px;font-size:17px;color:#24508a;font-weight:800;}
        table{width:100%;border-collapse:collapse;margin:0 0 14px;}
        th,td{border:1px solid #d8e4f7;padding:9px 10px;text-align:left;vertical-align:top;font-size:13px;line-height:1.45;}
        th{width:210px;background:#f4f8ff;color:#2d4b77;font-weight:700;}
        .text-block{margin:0 0 14px;padding:10px;border:1px solid #d8e4f7;border-radius:8px;background:#fafcff;font-size:13px;line-height:1.55;white-space:pre-wrap;}
        .link-list{margin:0 0 14px;padding-left:18px;}
        .link-list li{margin:4px 0;}
        .link-list a{color:#1f60b8;text-decoration:none;}
        .cover-block{margin-top:12px;border:1px dashed #b6c9e8;background:#f8fbff;border-radius:10px;padding:10px;}
        .cover-title{margin:0 0 8px;font-size:13px;color:#2f4d79;font-weight:700;}
        .cover-img{display:block;max-width:100%;height:auto;border:1px solid #d6e3f8;border-radius:8px;background:#ffffff;}
        .mail-foot{margin-top:14px;font-size:12px;color:#50678b;}
      `,
    datasetTableFields: [
      { key: 'datasetName', label: 'Dataset Name' },
      { key: 'userEmail', label: 'User Email' },
      { key: 'dataFormatScale', label: 'Data Format & Scale' },
      { key: 'usageLicense', label: 'Usage License' },
      { key: 'citationMethod', label: 'Citation Method' },
      { key: 'coverImageName', label: 'Cover Image File Name' },
    ],
    contactTableFields: [
      { key: 'userEmail', label: 'User Email' },
      { key: 'subject', label: 'Title' },
    ],
  },
}

function joinErrorItems(...items) {
  return items.map((item) => String(item || '').trim()).filter(Boolean)
}

export function resolveMailFailureAlert(sendResult, submitType = 'dataset_submission') {
  const copyMap = submissionMailConfig.failureAlerts || {}
  const code = String(sendResult?.code || '').trim() || 'default'
  const copy = copyMap[code] || copyMap.default
  const submitTypeLabel = submitType === 'contact_submission' ? 'Contact submission' : 'Dataset submission'

  const details = []
  if (sendResult?.httpStatus) {
    details.push(`HTTP status: ${sendResult.httpStatus}`)
  }
  if (sendResult?.detail) {
    details.push(`Provider detail: ${sendResult.detail}`)
  } else if (sendResult?.reason && sendResult.reason !== copy.hint) {
    details.push(sendResult.reason)
  }

  return {
    title: copy.title,
    description: `${submitTypeLabel}: ${copy.description}`,
    errors: joinErrorItems(copy.hint, ...details),
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function nowLabel() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

function renderFieldTable(rows) {
  const tableRows = rows
    .map((row) => `<tr><th>${escapeHtml(row.label)}</th><td>${escapeHtml(row.value || '-')}</td></tr>`)
    .join('')
  return `<table>${tableRows}</table>`
}

function buildHtmlFrame({ title, subtitle, bodyHtml }) {
  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>${submissionMailConfig.templates.htmlStyles}</style>
</head>
<body>
  <div class="mail-wrap">
    <div class="mail-card">
      <div class="mail-head">
        <h1 class="mail-title">${escapeHtml(title)}</h1>
        <p class="mail-sub">${escapeHtml(subtitle)}</p>
      </div>
      <div class="mail-body">
        ${bodyHtml}
      </div>
    </div>
  </div>
</body>
</html>
`.trim()
}

export function buildDatasetMailPayload(form) {
  const prefix = submissionMailConfig.templates.subjectPrefix
  const title = submissionMailConfig.templates.datasetTitle
  const subject = `${prefix} ${title}: ${form.datasetName || 'Untitled'}`
  const links = [form.cloudStorageLink1, form.cloudStorageLink2].map((item) => item?.trim()).filter(Boolean)

  const rows = submissionMailConfig.templates.datasetTableFields.map((field) => ({
    label: field.label,
    value: form[field.key] || '',
  }))

  const linksHtml = links.length
    ? `<ul class="link-list">${links.map((link) => `<li><a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link)}</a></li>`).join('')}</ul>`
    : '<p class="text-block">No cloud storage link provided.</p>'

  const coverHtml = form.coverImageDataUrl
    ? `
      <div class="cover-block">
        <p class="cover-title">Uploaded Cover Image Preview</p>
        <img class="cover-img" alt="${escapeHtml(form.coverImageName || 'Cover image')}" src="${form.coverImageDataUrl}" />
      </div>
    `
    : ''

  const bodyHtml = `
    <h2 class="section-title">Basic Information</h2>
    ${renderFieldTable(rows)}
    <h2 class="section-title">Short Description</h2>
    <p class="text-block">${escapeHtml(form.shortDescription || '')}</p>
    <h2 class="section-title">Cloud Storage Links</h2>
    ${linksHtml}
    ${coverHtml}
    <p class="mail-foot">Submitted at: ${escapeHtml(nowLabel())}</p>
  `

  const html = buildHtmlFrame({
    title,
    subtitle: `From: ${submissionMailConfig.senderEmail} | Reply-To: ${form.userEmail || '-'} | To: ${submissionMailConfig.targetEmail}`,
    bodyHtml,
  })

  const text = [
    `${title}`,
    `Dataset Name: ${form.datasetName || '-'}`,
    `User Email: ${form.userEmail || '-'}`,
    `Short Description: ${form.shortDescription || '-'}`,
    `Data Format & Scale: ${form.dataFormatScale || '-'}`,
    `Cloud Storage Link #1: ${form.cloudStorageLink1 || '-'}`,
    `Cloud Storage Link #2: ${form.cloudStorageLink2 || '-'}`,
    `Usage License: ${form.usageLicense || '-'}`,
    `Citation Method: ${form.citationMethod || '-'}`,
    `Cover Image File Name: ${form.coverImageName || '-'}`,
    `Submitted At: ${nowLabel()}`,
  ].join('\n')

  return { subject, html, text }
}

export function buildContactMailPayload(form) {
  const prefix = submissionMailConfig.templates.subjectPrefix
  const title = submissionMailConfig.templates.contactTitle
  const subject = `${prefix} ${title}: ${form.subject || 'Untitled'}`

  const rows = submissionMailConfig.templates.contactTableFields.map((field) => ({
    label: field.label,
    value: form[field.key] || '',
  }))

  const bodyHtml = `
    <h2 class="section-title">Contact Information</h2>
    ${renderFieldTable(rows)}
    <h2 class="section-title">Content</h2>
    <p class="text-block">${escapeHtml(form.content || '')}</p>
    <p class="mail-foot">Submitted at: ${escapeHtml(nowLabel())}</p>
  `

  const html = buildHtmlFrame({
    title,
    subtitle: `From: ${submissionMailConfig.senderEmail} | Reply-To: ${form.userEmail || '-'} | To: ${submissionMailConfig.targetEmail}`,
    bodyHtml,
  })

  const text = [
    `${title}`,
    `User Email: ${form.userEmail || '-'}`,
    `Title: ${form.subject || '-'}`,
    `Content: ${form.content || '-'}`,
    `Submitted At: ${nowLabel()}`,
  ].join('\n')

  return { subject, html, text }
}
