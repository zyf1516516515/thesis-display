const ALLOWED_ANCHORS = new Set(['dataset', 'competition', 'declaration'])

const MEDIA_MODULES = {
  ...import.meta.glob('../resources/**/*.{mp4,MP4,webm,WEBM,ogg,OGG,mov,MOV,m4v,M4V,svg,SVG,png,PNG,jpg,JPG,jpeg,JPEG,webp,WEBP,avif,AVIF,gif,GIF}', {
    eager: true,
    import: 'default',
  }),
  ...import.meta.glob('../svg_resource/**/*.{svg,SVG}', {
    eager: true,
    import: 'default',
  }),
}

const BASE_URL = normalizeBaseUrl(import.meta.env.BASE_URL || '/')
const MEDIA_SOURCE_MAP = buildMediaSourceMap(MEDIA_MODULES)

export function buildMediaSourceMap(modules) {
  const map = new Map()

  Object.entries(modules).forEach(([modulePath, bundledUrl]) => {
    const normalizedModulePath = normalizePath(modulePath)
    const normalizedSrcPath = normalizedModulePath.replace(/^\.\.\//, 'src/')

    addPathVariants(map, normalizedModulePath, bundledUrl)
    addPathVariants(map, normalizedSrcPath, bundledUrl)
    addPathVariants(map, `/${normalizedSrcPath}`, bundledUrl)
  })

  return map
}

export function resolveMediaSrc(src, sourceMap = MEDIA_SOURCE_MAP, baseUrl = BASE_URL) {
  if (!src) {
    return ''
  }

  const normalizedSrc = normalizePath(src)

  if (/^(https?:)?\/\//.test(normalizedSrc) || normalizedSrc.startsWith('data:') || normalizedSrc.startsWith('blob:')) {
    return normalizedSrc
  }

  const fromMap = sourceMap.get(normalizedSrc)
  if (fromMap) {
    return fromMap
  }

  const withoutLeadingSlash = normalizedSrc.replace(/^\//, '')
  const fromMapWithoutSlash = sourceMap.get(withoutLeadingSlash)
  if (fromMapWithoutSlash) {
    return fromMapWithoutSlash
  }

  if (
    normalizedSrc.startsWith('src/resources/') ||
    normalizedSrc.startsWith('/src/resources/') ||
    normalizedSrc.startsWith('src/svg_resource/') ||
    normalizedSrc.startsWith('/src/svg_resource/')
  ) {
    return ''
  }

  if (normalizedSrc.startsWith('/')) {
    return withBaseUrl(normalizedSrc, baseUrl)
  }

  if (normalizedSrc.startsWith('public/')) {
    return withBaseUrl(normalizedSrc.replace(/^public\//, ''), baseUrl)
  }

  if (/^[^./][^?]*\.[a-zA-Z0-9]+(?:\?.*)?$/.test(normalizedSrc)) {
    return withBaseUrl(normalizedSrc, baseUrl)
  }

  return normalizedSrc
}

export function extractAnchorFromHash(hash) {
  if (!hash) {
    return null
  }

  const cleaned = hash.replace(/^#/, '').replace(/^\//, '')
  if (!ALLOWED_ANCHORS.has(cleaned)) {
    return null
  }

  return cleaned
}

function normalizePath(path) {
  return path.replace(/\\/g, '/').trim()
}

function addPathVariants(map, rawPath, url) {
  const normalized = normalizePath(rawPath)
  const decoded = safeDecodePath(normalized)
  const encoded = safeEncodePath(normalized)

  const variants = new Set([normalized, decoded, encoded])
  variants.forEach((item) => {
    map.set(item, url)

    const withoutLeadingSlash = item.replace(/^\//, '')
    map.set(withoutLeadingSlash, url)
    map.set(`/${withoutLeadingSlash}`, url)
  })
}

function safeDecodePath(path) {
  try {
    return decodeURIComponent(path)
  } catch {
    return path
  }
}

function safeEncodePath(path) {
  try {
    return encodeURI(path)
  } catch {
    return path
  }
}

function normalizeBaseUrl(baseUrl) {
  const normalized = normalizePath(baseUrl || '/')
  const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

function withBaseUrl(path, baseUrl) {
  const normalizedPath = normalizePath(path).replace(/^\/+/, '')
  return `${normalizeBaseUrl(baseUrl)}${normalizedPath}`.replace(/([^:]\/)\/+/g, '$1')
}
