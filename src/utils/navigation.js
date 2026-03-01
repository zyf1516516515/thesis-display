const ANCHOR_MAP = {
  dataset: 'dataset',
  competition: 'competition',
  declaration: 'declaration',
}

export function getNavAction(key) {
  const target = ANCHOR_MAP[key]
  if (target) {
    return { type: 'anchor', target }
  }
  return { type: 'coming_soon' }
}

export function getVideoPlaybackMode(slot) {
  if (slot === 'hero') {
    return {
      autoplay: true,
      controls: false,
      loop: true,
      muted: true,
    }
  }

  return {
    autoplay: false,
    controls: true,
    loop: false,
    muted: false,
  }
}
