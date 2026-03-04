const OSS_BASE_URL = 'https://thesis-display-oss-bucket.sylg.chat'
const PREVIEW_PREFIX = 'public_min'
const ORIGINAL_PREFIX = 'public'

function ossAsset(prefix, path) {
  return encodeURI(`${OSS_BASE_URL}/${prefix}/${path}`)
}

function createMediaAsset(path, originalPath = path) {
  return {
    previewUrl: ossAsset(PREVIEW_PREFIX, path),
    downloadUrl: ossAsset(ORIGINAL_PREFIX, originalPath),
  }
}

export const mediaAssets = {
  meta: {
    logo: createMediaAsset('images/logo_rembg.png'),
    favicon: createMediaAsset('logo.ico'),
  },
  hero: {
    mainVideo: createMediaAsset('videos/enhance_wipe_cell_1080p_h264.mp4'),
  },
  performance: {
    demoImage: createMediaAsset(
      'images/Demonstration of improved imaging effect.webp',
      'images/Demonstration of improved imaging effect.svg',
    ),
  },
  resultVideo: {
    video1: createMediaAsset('videos/segment_last_30_merged_mini_h264.mp4'),
    video2: createMediaAsset('videos/SAM20M_endoscopy_00_EndoVis_2017_RIS_merged_h264.mp4'),
    video3: createMediaAsset('videos/屏幕录制 2026-02-13 160516.mp4'),
    video3Poster: createMediaAsset('videos/屏幕录制-封面.png'),
  },
  dataset: {
    previewImage: createMediaAsset('images/Enhancement behavior dataset.svg'),
  },
  extensibility: {
    integratedCircuit: createMediaAsset(
      'images/Integrated circuit.webp',
      'images/Integrated circuit.svg',
    ),
    metallographicAnalysis: createMediaAsset('images/metallographic analysis.svg'),
    droneAerial: createMediaAsset(
      'images/Drone aerial photography.webp',
      'images/Drone aerial photography.svg',
    ),
    underwaterDrone: createMediaAsset(
      'images/Underwater drone.webp',
      'images/Underwater drone.svg',
    ),
    agriculturalRobot: createMediaAsset(
      'images/Agricultural harvesting robot perspective.webp',
      'images/Agricultural harvesting robot perspective.svg',
    ),
    spaceExploration: createMediaAsset(
      'images/Space exploration.webp',
      'images/Space exploration.svg',
    ),
  },
  handDrawn: {
    image: createMediaAsset(
      'images/Hand drawn circuit diagram.webp',
      'images/Hand drawn circuit diagram.svg',
    ),
  },
  tutorial: {
    video: createMediaAsset('videos/System_Usage_Tutorial_h264.mp4'),
    poster: createMediaAsset('videos/System_Usage_Tutorial_h264-封面.jpg'),
  },
}
