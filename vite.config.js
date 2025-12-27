import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { viteSingleFile } from 'vite-plugin-singlefile'



// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    viteSingleFile() // 演示打包配置项
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
/*
  //演示打包配置项
  base: './',
  build: {
    assetsInlineLimit: 100000000, // 强制让所有资源都内联（避免生成额外的 assets 文件）
  }*/

  // github.io配置项
  base: '/thesis-display/',
})
