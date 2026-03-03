const OSS_BASE_URL = 'https://thesis-display-bucket.oss-ap-southeast-1.aliyuncs.com'

function ossPublic(path) {
  return encodeURI(`${OSS_BASE_URL}/public/${path}`)
}

export const mediaAssets = {
  meta: {
    logo: ossPublic('images/logo_rembg.png'),
    favicon: ossPublic('logo.ico'),
  },
  hero: {
    mainVideo: ossPublic('videos/enhance_wipe_cell_1080p_h264.mp4'),
  },
  performance: {
    demoImage: ossPublic('images/Demonstration of improved imaging effect.svg'),
  },
  resultVideo: {
    video1: ossPublic('videos/segment_last_30_merged_mini_h264.mp4'),
    video2: ossPublic('videos/SAM20M_endoscopy_00_EndoVis_2017_RIS_merged_h264.mp4'),
    video3: ossPublic('videos/屏幕录制 2026-02-13 160516.mp4'),
    video3Poster: ossPublic('videos/屏幕录制-封面.png'),
  },
  dataset: {
    previewImage: ossPublic('images/Enhancement behavior dataset.svg'),
  },
  extensibility: {
    integratedCircuit: ossPublic('images/Integrated circuit.svg'),
    metallographicAnalysis: ossPublic('images/metallographic analysis.svg'),
    droneAerial: ossPublic('images/Drone aerial photography.svg'),
    underwaterDrone: ossPublic('images/Underwater drone.svg'),
    agriculturalRobot: ossPublic('images/Agricultural harvesting robot perspective.svg'),
    spaceExploration: ossPublic('images/Space exploration.svg'),
  },
  handDrawn: {
    image: ossPublic('images/Hand drawn circuit diagram.svg'),
  },
  tutorial: {
    video: ossPublic('videos/System_Usage_Tutorial_h264.mp4'),
    poster: ossPublic('videos/System_Usage_Tutorial_h264-封面.jpg'),
  },
}

