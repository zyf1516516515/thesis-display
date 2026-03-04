# thesis-display

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

## Media Preview And Download Endpoints

The project separates preview resources and original-download resources in
`src/config/mediaAssets.js`.

Default behavior:
- preview URLs use CDN domain `thesis-display-oss-bucket.sylg.chat`
- download URLs use OSS origin domain `thesis-display-bucket.oss-ap-southeast-1.aliyuncs.com`

Configure these environment variables in `.env.production`:

```dotenv
VITE_OSS_PREVIEW_BASE_URL=https://thesis-display-oss-bucket.sylg.chat
VITE_OSS_PREVIEW_PREFIX=public_min

# Recommended: point this to a dedicated download domain/path configured to
# return Content-Disposition: attachment.
VITE_OSS_DOWNLOAD_BASE_URL=https://thesis-display-bucket.oss-ap-southeast-1.aliyuncs.com
VITE_OSS_DOWNLOAD_PREFIX=public
```

Recommended deployment model:

1. Keep preview URLs on the normal public media endpoint.
2. Use a dedicated download endpoint/domain for `VITE_OSS_DOWNLOAD_BASE_URL`.
3. Configure that download endpoint to always return
   `Content-Disposition: attachment`.
4. Do not rely on signed URLs as long-term static links in frontend configs.
