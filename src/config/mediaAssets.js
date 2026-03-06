const DEFAULT_PREVIEW_BASE_URL = 'https://thesis-display-bucket.oss-ap-southeast-1.aliyuncs.com'
const DEFAULT_DOWNLOAD_BASE_URL = 'https://thesis-display-bucket.oss-ap-southeast-1.aliyuncs.com'
const DEFAULT_PLACEHOLDER_BASE_URL = 'https://thesis-display-bucket.oss-ap-southeast-1.aliyuncs.com'

const PREVIEW_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_OSS_PREVIEW_BASE_URL || DEFAULT_PREVIEW_BASE_URL)
const DOWNLOAD_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_OSS_DOWNLOAD_BASE_URL || DEFAULT_DOWNLOAD_BASE_URL)
const PLACEHOLDER_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_OSS_PLACEHOLDER_BASE_URL || DEFAULT_PLACEHOLDER_BASE_URL)

const PREVIEW_PREFIX = normalizePrefix(import.meta.env.VITE_OSS_PREVIEW_PREFIX || 'public_min')
const ORIGINAL_PREFIX = 'public'
const DOWNLOAD_PREFIX = normalizePrefix(import.meta.env.VITE_OSS_DOWNLOAD_PREFIX || ORIGINAL_PREFIX)
const PLACEHOLDER_PREFIX = normalizePrefix(import.meta.env.VITE_OSS_PLACEHOLDER_PREFIX || 'svg_olaceholder')

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || '').replace(/\/+$/, '')
}

function normalizePrefix(prefix) {
  return String(prefix || '')
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
}

function buildOssAsset(baseUrl, prefix, path) {
  const normalizedPath = String(path || '').replace(/^\/+/, '')
  return encodeURI(`${baseUrl}/${prefix}/${normalizedPath}`)
}

function withVersion(url, version) {
  const normalizedVersion = String(version || '').trim()
  if (!normalizedVersion) {
    return url
  }
  const joiner = url.includes('?') ? '&' : '?'
  return `${url}${joiner}v=${encodeURIComponent(normalizedVersion)}`
}

function buildSvgPlaceholder(fileName) {
  if (!fileName) {
    return ''
  }
  return buildOssAsset(PLACEHOLDER_BASE_URL, PLACEHOLDER_PREFIX, fileName)
}

function createImageAsset(previewPath, originalPath = previewPath, placeholderFileName = '', previewVersion = '') {
  return {
    previewUrl: withVersion(buildOssAsset(PREVIEW_BASE_URL, PREVIEW_PREFIX, previewPath), previewVersion),
    originalPreviewUrl: buildOssAsset(PREVIEW_BASE_URL, ORIGINAL_PREFIX, originalPath),
    downloadUrl: buildOssAsset(DOWNLOAD_BASE_URL, DOWNLOAD_PREFIX, originalPath),
    placeholderUrl: buildSvgPlaceholder(placeholderFileName),
  }
}

function createVideoAsset(previewPath, originalPath = previewPath, previewVersion = '') {
  return {
    previewUrl: withVersion(buildOssAsset(PREVIEW_BASE_URL, PREVIEW_PREFIX, previewPath), previewVersion),
    originalPreviewUrl: buildOssAsset(PREVIEW_BASE_URL, ORIGINAL_PREFIX, originalPath),
    downloadUrl: buildOssAsset(DOWNLOAD_BASE_URL, DOWNLOAD_PREFIX, originalPath),
  }
}

function createPosterAsset(previewPath, originalPath = previewPath) {
  return {
    previewUrl: buildOssAsset(PREVIEW_BASE_URL, PREVIEW_PREFIX, previewPath),
    originalPreviewUrl: buildOssAsset(PREVIEW_BASE_URL, ORIGINAL_PREFIX, originalPath),
    downloadUrl: buildOssAsset(DOWNLOAD_BASE_URL, DOWNLOAD_PREFIX, originalPath),
  }
}

export const mediaAssets = {
  meta: {
    logo: createImageAsset('images/preview_q1/meta_logo.png', 'images/logo_rembg.png'),
    favicon: createImageAsset('logo.ico'),
  },
  hero: {
    mainVideo: createVideoAsset('videos/enhance_wipe_cell_1080p_h264.mp4'),
  },
  performance: {
    demoImage: createImageAsset(
      'images/preview_q2/performance_demoImage_fix20260305.png',
      'images/Demonstration of improved imaging effect.svg',
      'Demonstration of improved imaging effect.svg',
      '20260305c',
    ),
  },
  resultVideo: {
    video1: createVideoAsset('videos/segment_last_30_merged_mini_h264.mp4', 'videos/segment_last_30_merged_mini_h264.mp4', '20260305a'),
    video1Poster: createPosterAsset('images/preview_q2/resultVideo_video1Poster.png'),
    video2: createVideoAsset('videos/SAM20M_endoscopy_00_EndoVis_2017_RIS_merged_h264.mp4', 'videos/SAM20M_endoscopy_00_EndoVis_2017_RIS_merged_h264.mp4', '20260305a'),
    video2Poster: createPosterAsset('images/preview_q2/resultVideo_video2Poster.png'),
    video3: createVideoAsset('videos/屏幕录制 2026-02-13 160516.mp4'),
    video3Poster: createPosterAsset('images/preview_q1/resultVideo_video3Poster.png'),
  },
  dataset: {
    previewImage: createImageAsset(
      'images/preview_q1/dataset_previewImage.png',
      'images/Enhancement behavior dataset.svg',
      'Enhancement behavior dataset.svg',
    ),
  },
  extensibility: {
    integratedCircuit: createImageAsset(
      'images/preview_q1/extensibility_integratedCircuit.png',
      'images/Integrated circuit.svg',
      'Integrated circuit.svg',
      '20260305b',
    ),
    metallographicAnalysis: createImageAsset(
      'images/preview_q1/extensibility_metallographicAnalysis.png',
      'images/metallographic analysis.svg',
      'metallographic analysis.svg',
      '20260305b',
    ),
    droneAerial: createImageAsset(
      'images/preview_q2/extensibility_droneAerial.png',
      'images/Drone aerial photography.svg',
      'Drone aerial photography.svg',
      '20260305b',
    ),
    underwaterDrone: createImageAsset(
      'images/preview_q2/extensibility_underwaterDrone_fix20260305.png',
      'images/Underwater drone.svg',
      'Underwater drone.svg',
      '20260306e',
    ),
    agriculturalRobot: createImageAsset(
      'images/preview_q2/extensibility_agriculturalRobot.png',
      'images/Agricultural harvesting robot perspective.svg',
      'Agricultural harvesting robot perspective.svg',
      '20260305b',
    ),
    spaceExploration: createImageAsset(
      'images/preview_q2/extensibility_spaceExploration.png',
      'images/Space exploration.svg',
      'Space exploration.svg',
      '20260305b',
    ),
  },
  handDrawn: {
    image: createImageAsset(
      'images/preview_q1/handDrawn_image.png',
      'images/Hand drawn circuit diagram.svg',
      'Hand drawn circuit diagram.svg',
      '20260305b',
    ),
  },
  tutorial: {
    video: createVideoAsset('videos/System_Usage_Tutorial_h264.mp4'),
    poster: createPosterAsset('images/preview_q1/tutorial_poster.png'),
  },
}
