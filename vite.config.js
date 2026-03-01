import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { viteSingleFile } from 'vite-plugin-singlefile'

// 大体积 mp4 无法与 singlefile 强制内联共存，默认关闭。
// 如确需单文件输出，可在构建前设置环境变量 VITE_SINGLEFILE=true。
const enableSingleFile = process.env.VITE_SINGLEFILE === 'true'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    enableSingleFile ? viteSingleFile() : null,
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // GitHub Pages 配置
  base: '/thesis-display/',
})
