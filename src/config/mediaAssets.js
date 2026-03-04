const DEFAULT_OSS_BASE_URL = 'https://thesis-display-oss-bucket.sylg.chat'
const PREVIEW_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_OSS_PREVIEW_BASE_URL || DEFAULT_OSS_BASE_URL)
const DOWNLOAD_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_OSS_DOWNLOAD_BASE_URL || PREVIEW_BASE_URL,
)
const PREVIEW_PREFIX = normalizePrefix(import.meta.env.VITE_OSS_PREVIEW_PREFIX || 'public_min')
const DOWNLOAD_PREFIX = normalizePrefix(import.meta.env.VITE_OSS_DOWNLOAD_PREFIX || 'public')

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

function createMediaAsset(path, originalPath = path) {
  return {
    previewUrl: buildOssAsset(PREVIEW_BASE_URL, PREVIEW_PREFIX, path),
    downloadUrl: buildOssAsset(DOWNLOAD_BASE_URL, DOWNLOAD_PREFIX, originalPath),
  }
}

export const mediaAssets = {
  meta: {
    logo: createMediaAsset('images/preview_q1/meta_logo.png', 'images/logo_rembg.png'),
    favicon: createMediaAsset('logo.ico'),
  },
  hero: {
    mainVideo: createMediaAsset('videos/enhance_wipe_cell_1080p_h264.mp4'),
  },
  performance: {
    demoImage: createMediaAsset(
      'images/preview_q2/performance_demoImage.png',
      'images/Demonstration of improved imaging effect.svg',
    ),
  },
  resultVideo: {
    video1: createMediaAsset('videos/segment_last_30_merged_mini_h264.mp4'),
    video1Poster: createMediaAsset('images/preview_q2/resultVideo_video1Poster.png', 'videos/segment_last_30_merged_mini_h264.mp4'),
    video2: createMediaAsset('videos/SAM20M_endoscopy_00_EndoVis_2017_RIS_merged_h264.mp4'),
    video2Poster: createMediaAsset('images/preview_q2/resultVideo_video2Poster.png', 'videos/SAM20M_endoscopy_00_EndoVis_2017_RIS_merged_h264.mp4'),
    video3: createMediaAsset('videos/屏幕录制 2026-02-13 160516.mp4'),
    video3Poster: createMediaAsset('images/preview_q1/resultVideo_video3Poster.png', 'videos/屏幕录制-封面.png'),
  },
  dataset: {
    previewImage: createMediaAsset('images/preview_q1/dataset_previewImage.png', 'images/Enhancement behavior dataset.svg'),
  },
  extensibility: {
    integratedCircuit: createMediaAsset(
      'images/preview_q1/extensibility_integratedCircuit.png',
      'images/Integrated circuit.svg',
    ),
    metallographicAnalysis: createMediaAsset('images/preview_q1/extensibility_metallographicAnalysis.png', 'images/metallographic analysis.svg'),
    droneAerial: createMediaAsset(
      'images/preview_q2/extensibility_droneAerial.png',
      'images/Drone aerial photography.svg',
    ),
    underwaterDrone: createMediaAsset(
      'images/preview_q2/extensibility_underwaterDrone.png',
      'images/Underwater drone.svg',
    ),
    agriculturalRobot: createMediaAsset(
      'images/preview_q2/extensibility_agriculturalRobot.png',
      'images/Agricultural harvesting robot perspective.svg',
    ),
    spaceExploration: createMediaAsset(
      'images/preview_q2/extensibility_spaceExploration.png',
      'images/Space exploration.svg',
    ),
  },
  handDrawn: {
    image: createMediaAsset(
      'images/preview_q1/handDrawn_image.png',
      'images/Hand drawn circuit diagram.svg',
    ),
  },
  tutorial: {
    video: createMediaAsset('videos/System_Usage_Tutorial_h264.mp4'),
    poster: createMediaAsset('images/preview_q1/tutorial_poster.png', 'videos/System_Usage_Tutorial_h264-封面.jpg'),
  },
}
