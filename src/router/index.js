// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'
import index from '@/components/view/index.vue'

const routes = [
    { path: '/', component: index },
]

const router = createRouter({
    //注意：github.io不能使用History模式 （GitHub Pages 是纯静态文件服务，不支持 History 模式所需的服务器端路由重定向（即刷新非首页会导致 404 错误））
    // 必须使用 Hash 模式
    // 这种模式下 URL 会变成 https://你的名字.github.io/项目名/#/about
    history: createWebHashHistory(),
    routes
})

export default router