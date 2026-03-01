<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { siteContent } from './config/siteContent'
import { getNavAction, getVideoPlaybackMode } from './utils/navigation'
import { extractAnchorFromHash, resolveMediaSrc } from './utils/mediaResolver'

const comingSoonVisible = ref(false)
const comingSoonMessage = ref(siteContent.meta.comingSoonMessage || '正在开发中')
const datasetSubmissionVisible = ref(false)
const contactModalVisible = ref(false)
const coverInputRef = ref(null)
const datasetForm = ref({
  datasetName: '',
  shortDescription: '',
  dataFormatScale: '',
  cloudStorageLink: '',
  cloudProviders: [],
  usageLicense: '',
  citationMethod: '',
  coverImageName: '',
})
const contactForm = ref({
  subject: '',
  content: '',
})
const BODY_LOCK_CLASS = 'modal-scroll-lock'
const HEADER_OFFSET = 94
const logoSrc = computed(() => resolveMediaSrc(siteContent.meta.logoUrl))

function setBodyScrollLock(locked) {
  if (typeof document === 'undefined') {
    return
  }
  document.body.classList.toggle(BODY_LOCK_CLASS, locked)
}

function resolveComingSoonMessage(messageKey) {
  const messageMap = siteContent.meta.comingSoonMessages || {}
  return messageMap[messageKey] || messageMap.default || siteContent.meta.comingSoonMessage || '正在开发中'
}

function openComingSoon(messageKey = 'default') {
  comingSoonMessage.value = resolveComingSoonMessage(messageKey)
  comingSoonVisible.value = true
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

function toggleCloudProvider(providerKey) {
  const current = datasetForm.value.cloudProviders
  if (current.includes(providerKey)) {
    datasetForm.value.cloudProviders = current.filter((key) => key !== providerKey)
    return
  }
  datasetForm.value.cloudProviders = [...current, providerKey]
}

function triggerCoverUpload() {
  coverInputRef.value?.click()
}

function handleCoverChange(event) {
  const [file] = event.target.files || []
  datasetForm.value.coverImageName = file ? file.name : ''
}

function submitDatasetSubmission() {
  closeDatasetSubmissionModal()
  openComingSoon('dataset_submission_submit')
}

function openContactModal() {
  contactModalVisible.value = true
}

function closeContactModal() {
  contactModalVisible.value = false
}

function submitContactForm() {
  closeContactModal()
  openComingSoon('contact_submit')
}

watch(
  [comingSoonVisible, datasetSubmissionVisible, contactModalVisible],
  ([comingSoon, datasetSubmission, contact]) => {
    setBodyScrollLock(comingSoon || datasetSubmission || contact)
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

onMounted(() => {
  document.title = siteContent.meta.pageTitle

  window.addEventListener('hashchange', handleHashChange)
})

onBeforeUnmount(() => {
  setBodyScrollLock(false)
  window.removeEventListener('hashchange', handleHashChange)
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

    <main class="page-main">
      <section class="shell hero-section">
        <div class="hero-content">
          <h2 class="focus-title">{{ siteContent.hero.title }}</h2>

          <div class="arrow-group" v-for="(bullet, index) in siteContent.hero.bullets" :key="`hero-bullet-${index}`">
            <div class="arrow-icon">➢</div>
            <div class="arrow-lines">
              <p v-for="(line, lineIndex) in bullet" :key="`hero-bullet-line-${index}-${lineIndex}`" class="line-text">
                {{ line }}
              </p>
            </div>
          </div>
        </div>

        <div class="hero-media-wrap">
          <video
            v-if="resolveMediaSrc(siteContent.hero.video.src)"
            class="hero-video"
            :src="resolveMediaSrc(siteContent.hero.video.src)"
            :poster="resolvePosterSrc(siteContent.hero.video.poster)"
            :autoplay="getVideoMode(siteContent.hero.video.slot).autoplay"
            :controls="getVideoMode(siteContent.hero.video.slot).controls"
            :loop="getVideoMode(siteContent.hero.video.slot).loop"
            :muted="getVideoMode(siteContent.hero.video.slot).muted"
            playsinline
            preload="metadata"
          />
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

      <section class="shell block-section">
        <h2 class="section-title"><span class="title-mark">◼</span>{{ siteContent.sections.performance.title }}</h2>
        <article class="panel-card">
          <h3 class="panel-title">{{ siteContent.sections.performance.panelTitle }}</h3>
          <img
            v-if="resolveMediaSrc(siteContent.sections.performance.image.src)"
            :src="resolveMediaSrc(siteContent.sections.performance.image.src)"
            :alt="siteContent.sections.performance.image.alt"
            class="media-image performance-image"
          />
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
            <video
              v-if="resolveMediaSrc(video.src)"
              class="section-video"
              :src="resolveMediaSrc(video.src)"
              :poster="resolvePosterSrc(video.poster)"
              :autoplay="getVideoMode(video.slot).autoplay"
              :controls="getVideoMode(video.slot).controls"
              :loop="getVideoMode(video.slot).loop"
              :muted="getVideoMode(video.slot).muted"
              playsinline
              preload="metadata"
            />
          </article>
        </div>

        <article class="video-card video-card-wide video-card-result_video_3">
          <video
            v-if="resolveMediaSrc(siteContent.sections.resultVideo.videos[2].src)"
            class="section-video"
            :src="resolveMediaSrc(siteContent.sections.resultVideo.videos[2].src)"
            :poster="resolvePosterSrc(siteContent.sections.resultVideo.videos[2].poster)"
            :autoplay="getVideoMode(siteContent.sections.resultVideo.videos[2].slot).autoplay"
            :controls="getVideoMode(siteContent.sections.resultVideo.videos[2].slot).controls"
            :loop="getVideoMode(siteContent.sections.resultVideo.videos[2].slot).loop"
            :muted="getVideoMode(siteContent.sections.resultVideo.videos[2].slot).muted"
            playsinline
            preload="metadata"
          />
        </article>
      </section>

      <section :id="siteContent.sections.dataset.id" class="shell block-section anchor-block">
        <h2 class="section-title"><span class="title-mark">◼</span>{{ siteContent.sections.dataset.title }}</h2>
        <div class="dataset-layout">
          <div class="dataset-text">
            <p v-for="(line, index) in siteContent.sections.dataset.lines" :key="`dataset-line-${index}`">{{ line }}</p>
          </div>

          <article class="dataset-card">
            <h3 class="dataset-card-title">{{ siteContent.sections.dataset.cardTitle }}</h3>
            <img
              v-if="resolveMediaSrc(siteContent.sections.dataset.image.src)"
              :src="resolveMediaSrc(siteContent.sections.dataset.image.src)"
              :alt="siteContent.sections.dataset.image.alt"
              class="media-image dataset-image"
            />
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

      <section class="shell block-section">
        <h2 class="section-title"><span class="title-mark">◼</span>{{ siteContent.sections.extensibility.title }}</h2>
        <div class="intro-lines">
          <p v-for="(line, index) in siteContent.sections.extensibility.introLines" :key="`ext-line-${index}`">{{ line }}</p>
        </div>

        <article
          v-for="(block, index) in siteContent.sections.extensibility.blocks"
          :key="block.key"
          class="panel-card compact"
        >
          <h3 class="panel-subtitle">{{ block.title }}</h3>
          <img
            v-if="resolveMediaSrc(block.image.src)"
            :src="resolveMediaSrc(block.image.src)"
            :alt="block.image.alt"
            :class="['media-image', { 'ext-space-image': block.key === 'ext_6' }]"
          />
          <p v-if="index === siteContent.sections.extensibility.blocks.length - 1" class="panel-note">
            {{ siteContent.sections.extensibility.note }}
          </p>
        </article>
      </section>

      <section class="shell block-section">
        <article class="panel-card compact">
          <h3 class="panel-subtitle">{{ siteContent.sections.handDrawn.title }}</h3>
          <img
            v-if="resolveMediaSrc(siteContent.sections.handDrawn.image.src)"
            :src="resolveMediaSrc(siteContent.sections.handDrawn.image.src)"
            :alt="siteContent.sections.handDrawn.image.alt"
            class="media-image"
          />
        </article>
      </section>

      <section class="shell block-section">
        <h2 class="section-title"><span class="title-mark">◼</span>{{ siteContent.sections.tutorial.title }}</h2>
        <div class="tutorial-layout">
          <div class="tutorial-list">
            <p v-for="(item, index) in siteContent.sections.tutorial.bullets" :key="`tutorial-${index}`">➢ {{ item }}</p>
          </div>
          <div class="tutorial-media">
            <video
              v-if="resolveMediaSrc(siteContent.sections.tutorial.video.src)"
              class="section-video tutorial-video"
              :src="resolveMediaSrc(siteContent.sections.tutorial.video.src)"
              :poster="resolvePosterSrc(siteContent.sections.tutorial.video.poster)"
              :autoplay="getVideoMode(siteContent.sections.tutorial.video.slot).autoplay"
              :controls="getVideoMode(siteContent.sections.tutorial.video.slot).controls"
              :loop="getVideoMode(siteContent.sections.tutorial.video.slot).loop"
              :muted="getVideoMode(siteContent.sections.tutorial.video.slot).muted"
              playsinline
              preload="metadata"
            />
          </div>
        </div>
      </section>

      <section class="shell block-section">
        <h2 class="section-title"><span class="title-mark">◼</span>{{ siteContent.sections.dataRelease.title }}</h2>
        <div class="intro-lines">
          <p v-for="(line, index) in siteContent.sections.dataRelease.lines" :key="`release-line-${index}`">{{ line }}</p>
        </div>
        <button
          type="button"
          class="pill-btn pill-btn-paper long-btn section-cta"
          @click="openDatasetSubmissionModal"
        >
          {{ siteContent.sections.dataRelease.button.label }}
        </button>
      </section>

      <section :id="siteContent.sections.competition.id" class="shell block-section anchor-block">
        <h2 class="section-title"><span class="title-mark">◼</span>{{ siteContent.sections.competition.title }}</h2>
        <div class="intro-lines">
          <p v-for="(line, index) in siteContent.sections.competition.lines" :key="`competition-line-${index}`">{{ line }}</p>
        </div>
        <button
          type="button"
          class="pill-btn pill-btn-paper long-btn section-cta"
          @click="openComingSoon(siteContent.sections.competition.button.key)"
        >
          {{ siteContent.sections.competition.button.label }}
        </button>
      </section>

      <section :id="siteContent.sections.declaration.id" class="shell block-section anchor-block">
        <h2 class="section-title"><span class="title-mark">◼</span>{{ siteContent.sections.declaration.title }}</h2>
        <p class="declaration-text">
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
                  <input
                    v-model="datasetForm.datasetName"
                    type="text"
                    class="dataset-input"
                    :placeholder="siteContent.sections.dataRelease.portal.placeholders.datasetName"
                  />
                </div>

                <div class="dataset-form-row">
                  <label class="dataset-form-label required">{{ siteContent.sections.dataRelease.portal.fields.shortDescription }}</label>
                  <textarea
                    v-model="datasetForm.shortDescription"
                    class="dataset-textarea"
                    rows="3"
                    :placeholder="siteContent.sections.dataRelease.portal.placeholders.shortDescription"
                  />
                </div>

                <div class="dataset-form-row">
                  <label class="dataset-form-label required">{{ siteContent.sections.dataRelease.portal.fields.dataFormatScale }}</label>
                  <input
                    v-model="datasetForm.dataFormatScale"
                    type="text"
                    class="dataset-input"
                    :placeholder="siteContent.sections.dataRelease.portal.placeholders.dataFormatScale"
                  />
                </div>

                <div class="dataset-form-row">
                  <label class="dataset-form-label required">{{ siteContent.sections.dataRelease.portal.fields.cloudStorageLink }}</label>
                  <div class="dataset-field-stack">
                    <input
                      v-model="datasetForm.cloudStorageLink"
                      type="text"
                      class="dataset-input"
                      :placeholder="siteContent.sections.dataRelease.portal.placeholders.cloudStorageLink"
                    />
                    <div class="cloud-provider-list">
                      <label
                        v-for="provider in siteContent.sections.dataRelease.portal.cloudProviders"
                        :key="provider.key"
                        :class="['cloud-provider-chip', { active: datasetForm.cloudProviders.includes(provider.key) }]"
                      >
                        <input
                          class="cloud-provider-input"
                          type="checkbox"
                          :checked="datasetForm.cloudProviders.includes(provider.key)"
                          @change="toggleCloudProvider(provider.key)"
                        />
                        <span>{{ provider.label }}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </section>

              <section class="dataset-pane">
                <h3 class="dataset-pane-title">{{ siteContent.sections.dataRelease.portal.rightTitle }}</h3>

                <div class="dataset-form-row">
                  <label class="dataset-form-label required">{{ siteContent.sections.dataRelease.portal.fields.usageLicense }}</label>
                  <select v-model="datasetForm.usageLicense" class="dataset-input dataset-select">
                    <option value="" disabled>Select (e.g. CC-BY, MIT, etc.)</option>
                    <option
                      v-for="license in siteContent.sections.dataRelease.portal.licenseOptions"
                      :key="license"
                      :value="license"
                    >
                      {{ license }}
                    </option>
                  </select>
                </div>

                <div class="dataset-form-row">
                  <label class="dataset-form-label required">{{ siteContent.sections.dataRelease.portal.fields.citationMethod }}</label>
                  <textarea
                    v-model="datasetForm.citationMethod"
                    class="dataset-textarea"
                    rows="3"
                    :placeholder="siteContent.sections.dataRelease.portal.placeholders.citationMethod"
                  />
                </div>

                <div class="dataset-form-row">
                  <label class="dataset-form-label required">{{ siteContent.sections.dataRelease.portal.fields.uploadCoverImage }}</label>
                  <div class="dataset-upload-box">
                    <button type="button" class="pill-btn dataset-upload-btn" @click="triggerCoverUpload">
                      {{ siteContent.sections.dataRelease.portal.uploadButtonText }}
                    </button>
                    <input
                      ref="coverInputRef"
                      class="dataset-upload-input"
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      @change="handleCoverChange"
                    />
                    <p class="dataset-upload-hint">
                      {{ datasetForm.coverImageName || siteContent.sections.dataRelease.portal.uploadHint }}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <button type="submit" class="pill-btn pill-btn-paper dataset-submit-btn">{{ siteContent.sections.dataRelease.portal.submitText }}</button>
            <p class="dataset-submit-note">{{ siteContent.sections.dataRelease.portal.submitNote }}</p>
          </form>
        </div>
      </div>
    </Transition>

    <Transition name="contact-modal">
      <div v-if="contactModalVisible" class="contact-overlay" @click="closeContactModal">
        <div class="contact-card" @click.stop>
          <h3 class="contact-title">{{ siteContent.sections.declaration.contactForm.title }}</h3>
          <form class="contact-form" @submit.prevent="submitContactForm">
            <label class="contact-label">
              {{ siteContent.sections.declaration.contactForm.fields.subject }}
            </label>
            <input
              v-model="contactForm.subject"
              type="text"
              class="contact-input"
              :placeholder="siteContent.sections.declaration.contactForm.placeholders.subject"
            />
            <label class="contact-label">
              {{ siteContent.sections.declaration.contactForm.fields.content }}
            </label>
            <textarea
              v-model="contactForm.content"
              class="contact-textarea"
              rows="6"
              :placeholder="siteContent.sections.declaration.contactForm.placeholders.content"
            />
            <button type="submit" class="pill-btn pill-btn-paper contact-submit-btn">
              {{ siteContent.sections.declaration.contactForm.submitText }}
            </button>
          </form>
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
}

:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  background:
    radial-gradient(circle at 12% -8%, rgba(136, 170, 223, 0.22), transparent 40%),
    radial-gradient(circle at 88% 0%, rgba(100, 140, 208, 0.16), transparent 36%),
    #edf2f8;
  color: #1d2738;
  font-family: 'Montserrat', 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
}

:global(body.modal-scroll-lock) {
  overflow: hidden;
  overscroll-behavior: none;
}

.app-root {
  --surface: #ffffff;
  --surface-soft: #f5f8fc;
  --text-main: #1d2738;
  --text-muted: #4f607b;
  --line: #d8e1ee;
  --brand: #5f82bc;
  --brand-strong: #496fa9;
  --brand-soft: rgba(95, 130, 188, 0.14);
  --shadow-soft: 0 12px 30px rgba(28, 47, 79, 0.1);
  --performance-media-width: 92%;
  --result-video-top-width: 92%;
  --result-video-bottom-width: 92%;
  --result-video-top-gap: 14px;
  --result-video-top-item-width: 45%;
  --result-video-top-item-aspect-ratio: 16 / 5;
  --result-video-bottom-aspect-ratio: 1714 / 858;
  --hero-video-aspect-ratio: 700 / 460;
  min-height: 100vh;
  color: var(--text-main);
}

.shell {
  width: min(1140px, calc(100% - 28px));
  margin: 0 auto;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(102, 129, 173, 0.22);
}

.header-inner {
  position: relative;
  min-height: 74px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 0;
}

.header-inner.without-logo {
  justify-content: center;
}

.logo-box {
  position: absolute;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  height: 78px;
  display: flex;
  align-items: center;
}

.logo-image {
  max-height: 66px;
  width: auto;
  display: block;
}

.header-title {
  margin: 0;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: clamp(14px, 1.4vw, 20px);
  font-weight: 800;
  letter-spacing: 0.01em;
  white-space: nowrap;
  line-height: 1.1;
  color: #202a3b;
}

.page-main {
  padding: 16px 0 50px;
}

.hero-section {
  display: grid;
  grid-template-columns: 1fr minmax(300px, 39%);
  gap: 30px;
  align-items: start;
  padding: 0;
}

.focus-title {
  margin: 4px 0 20px;
  font-size: clamp(31px, 3.7vw, 46px);
  font-weight: 800;
  color: #162740;
  line-height: 1.1;
}

.arrow-group {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.arrow-icon {
  color: var(--brand-strong);
  font-size: 14px;
  line-height: 1.5;
  margin-top: 2px;
}

.arrow-lines {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.line-text {
  margin: 0;
  font-size: clamp(16px, 1.35vw, 19px);
  line-height: 1.4;
  color: #27364e;
}

.hero-media-wrap {
  margin-top: 8px;
  width: 100%;
  aspect-ratio: var(--hero-video-aspect-ratio);
}

.hero-video,
.section-video {
  width: 100%;
  display: block;
  border: 1px solid var(--line);
  border-radius: 0;
}

.hero-video {
  background: transparent;
  object-fit: cover;
  object-position: center;
}

.section-video {
  background: transparent;
  object-fit: cover;
}

.media-image {
  width: 100%;
  display: block;
  border: 1px solid var(--line);
  border-radius: 0;
  background: transparent;
  object-fit: contain;
  height: auto;
  max-height: 460px;
  min-height: 0;
}

.performance-image {
  width: var(--performance-media-width);
  margin: 0 auto;
  max-height: none;
}

.hero-video {
  height: 100%;
  min-height: 0;
}

.nav-section {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin: 20px auto 8px;
  padding: 0;
}

.pill-btn {
  border: 1px solid rgba(73, 111, 169, 0.22);
  border-radius: 999px;
  min-height: 44px;
  background: linear-gradient(145deg, #9bb5dd, #6f93cc);
  color: #0f243e;
  font-weight: 800;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease, background 0.2s ease;
  box-shadow: 0 6px 14px rgba(49, 76, 117, 0.16);
}

.pill-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(49, 76, 117, 0.24);
  filter: brightness(1.04);
}

.pill-btn.muted {
  background: linear-gradient(145deg, #c4d2ea, #9ab2d9);
}

.pill-btn-paper {
  background: linear-gradient(145deg, #c9d9ef, #b1c8e7);
}

.long-btn {
  width: 100%;
}

.block-section {
  margin-top: 22px;
  padding: 0;
}

.section-title {
  margin: 0 0 14px;
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: clamp(20px, 2.05vw, 30px);
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
.sub-panel-title,
.dataset-card-title {
  margin: 0 0 10px;
  text-align: center;
  font-size: clamp(16px, 1.45vw, 24px);
  font-weight: 700;
  color: #22324a;
}

.sub-panel-title {
  margin-bottom: 14px;
}

.panel-subtitle {
  font-size: clamp(16px, 1.3vw, 21px);
}

.panel-note {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--text-muted);
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
  min-height: 0;
}

.video-card-wide {
  margin-top: 14px;
  width: var(--result-video-bottom-width);
  margin-left: auto;
  margin-right: auto;
}

.video-card-result_video_1 {
  flex: 0 0 var(--result-video-top-item-width);
  aspect-ratio: var(--result-video-top-item-aspect-ratio);
}

.video-card-result_video_2 {
  flex: 0 0 var(--result-video-top-item-width);
  aspect-ratio: var(--result-video-top-item-aspect-ratio);
}

.video-card-result_video_3 {
  aspect-ratio: var(--result-video-bottom-aspect-ratio);
}

.video-card .section-video,
.video-card-wide .section-video {
  height: 100%;
  min-height: 0;
}

.dataset-layout {
  display: grid;
  grid-template-columns: 1fr minmax(280px, 40%);
  gap: 18px;
  align-items: stretch;
}

.dataset-text,
.intro-lines {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.dataset-text {
  max-width: 75%;
}

.dataset-text p,
.intro-lines p,
.tutorial-list p,
.declaration-text {
  margin: 0;
  font-size: clamp(14px, 0.96vw, 17px);
  line-height: 1.45;
  color: #2a3a52;
}

.dataset-card {
  background: transparent;
  border: 0;
  border-radius: 0;
  padding: 0;
}

.dataset-card-title {
  font-size: clamp(16px, 1.3vw, 22px);
}

.dataset-image {
  height: auto;
  min-height: 0;
}

.dataset-image {
  max-height: 190px;
}

.dataset-label-row {
  margin-top: 6px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  color: #4f5d73;
  font-size: clamp(12px, 0.95vw, 16px);
  text-align: center;
}

.dataset-btn-row {
  margin-top: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
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
  gap: 6px;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.tutorial-media {
  aspect-ratio: 1750 / 932;
  width: 75%;
  margin-left: auto;
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
  margin-top: 26px;
}

.ext-space-image {
  aspect-ratio: 664 / 262;
  object-fit: cover;
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
  padding: 20px;
}

.dataset-submit-card {
  width: min(980px, 96vw);
  max-height: 90vh;
  overflow: auto;
  border-radius: 18px;
  border: 1px solid rgba(117, 152, 206, 0.4);
  background: linear-gradient(180deg, rgba(243, 248, 255, 0.96), rgba(236, 244, 255, 0.95));
  box-shadow: 0 24px 54px rgba(16, 37, 71, 0.28);
  padding: 22px 26px 18px;
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
  gap: 14px;
}

.dataset-pane {
  border: 1px solid rgba(164, 188, 224, 0.56);
  background: rgba(255, 255, 255, 0.88);
  border-radius: 14px;
  padding: 14px 14px 12px;
}

.dataset-pane-title {
  margin: 0 0 10px;
  font-size: 24px;
  font-weight: 800;
  color: #244273;
}

.dataset-form-row {
  display: grid;
  grid-template-columns: 145px 1fr;
  align-items: start;
  gap: 8px;
  margin-bottom: 10px;
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
  cursor: pointer;
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

.cloud-provider-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cloud-provider-chip {
  border: 1px solid rgba(134, 164, 208, 0.58);
  border-radius: 999px;
  background: rgba(235, 244, 255, 0.92);
  color: #29528f;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  padding: 7px 12px;
  cursor: pointer;
  transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
}

.cloud-provider-chip.active {
  background: rgba(53, 114, 203, 0.16);
  border-color: #4c7fc8;
  color: #1b447d;
}

.cloud-provider-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.dataset-upload-box {
  border: 1px dashed rgba(130, 162, 208, 0.7);
  border-radius: 10px;
  background: rgba(246, 250, 255, 0.95);
  padding: 10px;
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

.dataset-submit-btn {
  align-self: center;
  min-width: 230px;
  font-size: 20px;
}

.dataset-submit-note {
  margin: 0;
  text-align: center;
  font-size: 18px;
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
    --performance-media-width: 100%;
    --result-video-top-width: 100%;
    --result-video-bottom-width: 100%;
    --result-video-top-item-width: 100%;
  }

  .header-inner {
    min-height: 60px;
  }

  .logo-box {
    height: 58px;
    left: -6px;
  }

  .logo-image {
    max-height: 50px;
  }

  .header-title {
    font-size: clamp(13px, 2.1vw, 17px);
    white-space: normal;
  }

  .hero-section {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 0;
  }

  .hero-media-wrap {
    margin-top: 0;
  }

  .nav-section {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .section-title {
    font-size: clamp(19px, 4.3vw, 27px);
  }

  .line-text,
  .dataset-text p,
  .intro-lines p,
  .tutorial-list p,
  .declaration-text {
    font-size: clamp(15px, 2.4vw, 18px);
  }

  .tutorial-layout .tutorial-list {
    min-height: 0;
  }

  .dataset-layout,
  .tutorial-layout {
    grid-template-columns: 1fr;
  }

  .dataset-text,
  .tutorial-media,
  .performance-image {
    width: 100%;
    max-width: 100%;
  }

  .video-grid-top {
    flex-direction: column;
  }

  .dataset-submit-card {
    width: min(980px, 98vw);
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
}

@media (max-width: 680px) {
  .shell {
    width: min(1140px, calc(100% - 18px));
  }

  .page-main {
    padding-top: 12px;
  }

  .nav-section {
    gap: 10px;
    padding: 0;
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


