<template>
  <div class="app-root">
    <!--
      第一页容器
      不再锁死 height:100vh，而是 min-height:100vh。
      这样内容放大时，页面会自动变长，滚动条是浏览器原生的。
    -->
    <div class="page-container">

      <!--
        1. 头部
        使用 position: sticky。
        在文档流中它占据真实高度（放大时会把下面内容推下去），
        滚动时它会吸附在顶部。
      -->
      <header class="sticky-header">
        <div class="header-left">
          <img :src="imgUrl1" alt="Logo" class="logo-img" />
        </div>

        <div class="header-center">
          <p class="header-text">
            {{ headerTitle }}
          </p>
        </div>

        <div class="header-right">
          <a class="sign-in-link" @click.prevent="goToSolutions">
            Sign in
          </a>
        </div>
      </header>

      <!--
        2. 主体内容
        移除了 scroll-wrapper，直接放在流中。
      -->
      <main class="main-content">
        <div class="content-row">
          <div class="col-text">
            <h1 class="page-title">Focus</h1>
            <div class="list-container">
              <div class="list-item" v-for="(item, index) in listItems" :key="index">
                <img :src="bulletIconUrl" alt="icon" class="bullet-icon" />
                <span class="list-text">{{ item }}</span>
              </div>
            </div>
          </div>

          <div class="col-image">
            <img :src="imgUrl2" alt="Main Display" class="responsive-match-height-img" />
          </div>
        </div>
      </main>

      <footer class="footer-nav">
        <div
            class="nav-btn"
            v-for="(btn, index) in buttons"
            :key="index"
            @click="goToSolutions"
        >
          <span class="btn-title">{{ btn.title }}</span>
          <span v-if="btn.subtitle" class="btn-subtitle">{{ btn.subtitle }}</span>
        </div>
      </footer>
    </div>

    <!-- 第二页 (保持不变) -->
    <div class="full-screen-container">
      <header class="header">
        <h1 class="main-title">{{ pageData.title }}</h1>
      </header>

      <main class="content-wrapper">
        <div class="left-section">
          <div class="text-content">
            {{ pageData.text }}
          </div>
        </div>

        <div class="right-section">
          <div class="image-container">
            <img :src="pageData.imgUrl" alt="展示图片" />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>


<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const goToSolutions = () => {
  /*// 调试日志：按 F12 看 Console 是否有这句话输出
  console.log('正在尝试跳转到 /solutions ...');

  if (!router) {
    console.error('错误：Router 未找到，请检查 main.js 是否使用了 app.use(router)');
    alert('跳转失败：Router未加载');
    return;
  }

  router.push('/solutions').catch(err => {
    console.error('跳转报错:', err);
  });*/

  console.log('正在新窗口打开 Bilibili ...');

  // 第一个参数是网址，第二个参数 '_blank' 表示新标签页
  window.open('https://www.bilibili.com/', '_blank');
};


/**
 * 顶部中间标题
 */
const headerTitle = ref('Empowering the Community for Unmatched Image Quality Enhancement\n')

/**
 * 图片资源
 */
import img_url1 from '@/staticResources/ppt1/ppt1_1.png'
import bullet_icon_url from '@/staticResources/ppt1/ppt1_2.png'
import img_url2 from '@/staticResources/ppt1/ppt1_3.png'
// 左上角 Logo
const imgUrl1 = ref(img_url1);
//列表箭头
const bulletIconUrl = ref(bullet_icon_url);
// 右侧图片
const imgUrl2 = ref(img_url2);
/**
 * 列表内容数据
 */
const listItems = ref([
  'Committed to significantly improving the imaging quality in all industries.',
  'Non-professionals can quickly enhance their imaging results.',
  'Committed to advancing scientific research in the field of image enhancement, with a focus on data production, data sharing, and code.'
]);

const buttons = ref([
  { title: 'DATASET', subtitle: '' },
  { title: 'PAPER', subtitle: '' },
  { title: 'CODE', subtitle: '' },
  { title: 'COMPETITION', subtitle: '' },
  { title: 'DATASET', subtitle: 'SUBMISSION' },
]);

import { reactive } from 'vue';
import ppt2Image from '@/staticResources/ppt2/ppt2_1.png'

// 3. 所有文字和图片的url都存储到script部分
const pageData = reactive({
  //顶部标题
  title: 'Our solutions for enhancing imaging quality',
  // 左侧文本
  text: 'We report a general image enhancement framework for life sciences based on behavioral learning. This framework can adapt to new imaging scenarios in minimal time while achieving unified enhancement across diverse scenarios. Based on this framework, we provide a real-world database of life science image enhancement comprising 2.4 million sample images. We welcome users in need to utilize this resource and invite relevant scholars and teams to join us in advancing the intelligent evolution of image enhancement technology.\n',
  // 右侧图片
  imgUrl: ppt2Image});
</script>

<style scoped>
/* =========================================
   全局重置
   ========================================= */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* 恢复原生滚动 */
body {
  overflow-x: hidden;
  width: 100%;
}

.app-root {
  width: 100%;
}

/* =========================================
   1. 第一页容器
   ========================================= */
.page-container {
  display: flex;
  flex-direction: column;
  /* 允许高度随内容自动撑开，不锁死 */
  min-height: 100vh;
  width: 100%;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: #333;
  background-color: #f5f7fa;
  /* 必须 visible 才能让 sticky 生效 */
  overflow: visible;
}

/* =========================================
   2. Sticky 头部 (吸顶 + 白色背景)
   ========================================= */
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  flex-shrink: 0;

  width: 100%;

  /* [修改] 背景色改为白色 */
  background-color: #ffffff;
  /* 保留淡淡的底边框，以便在白色背景上区分 */
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);

  display: flex;
  align-items: center;
  padding: 0.8rem 3%;

  height: auto;
  min-height: 80px;
}

.header-left, .header-right {
  flex: 0 1 auto;
  display: flex;
  align-items: center;
  min-width: 60px;
}
.header-right { justify-content: flex-end; }
.header-center {
  flex: 1;
  text-align: center;
  padding: 0 1rem;
  min-width: 0;
}

.header-text {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
  line-height: 1.3;
  white-space: normal;
  word-break: break-word;
}

.sign-in-link {
  font-size: 1rem;
  color: #000;
  text-decoration: none;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
}
.logo-img { height: 70px; width: auto; display: block; }

/* =========================================
   3. 主内容区域
   ========================================= */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 5%;
}

.content-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: stretch;
  width: 100%;
  margin-bottom: 2rem;
}

/* 文本列：靠上对齐 + 顶部留白，防止被 Header 遮挡 */
.col-text {
  flex: 1;
  padding-right: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start; /* 关键：靠上排 */
  padding-top: 10vh;           /* 关键：顶部留白 */
}

.page-title {
  font-size: 3rem;
  font-weight: 800;
  margin: 0 0 2rem 0;
  line-height: 1.2;
}

.list-item {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
}

.bullet-icon {
  width: 18px;
  height: 18px;
  margin-right: 15px;
  object-fit: contain;
  flex-shrink: 0;
}

.col-image {
  flex: 1;
  position: relative;
  min-height: 200px;
  margin-top: 5vh;
}

.responsive-match-height-img {
  width: 100%;
  height: auto;
  object-fit: contain;
  max-width: 100%;
}

/* =========================================
   4. 底部按钮 (字体加粗)
   ========================================= */
.footer-nav {
  padding: 2rem 5% 4rem 5%;
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  flex-shrink: 0;
  margin-top: auto;
}

.nav-btn {
  background-color: #9ab4e3;
  color: #000;
  border-radius: 40px;
  padding: 12px 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);

  /* [修改] 字体加粗 */
  font-weight: bold;
}

/* 如果需要标题和副标题粗细不同，可单独设置，
   目前 nav-btn 加粗会同时应用到下面两个 span */
.btn-title {
  font-size: 1rem;
}
.btn-subtitle {
  font-size: 0.85rem;
  margin-top: 4px;
}

/* =========================================
   响应式
   ========================================= */
@media (max-width: 768px) {
  .content-row { flex-direction: column; }
  .header-left, .header-right { flex: 0 0 auto; }

  .col-text {
    padding-top: 2rem;
    padding-right: 0;
  }

  .col-image {
    min-height: auto;
    height: auto;
    margin-top: 2rem;
  }

  .responsive-match-height-img {
    position: static;
  }

  .footer-nav { flex-wrap: wrap; }
  .nav-btn { min-width: 40%; }
}

/* =========================================
   第二页保持原样
   ========================================= */
.full-screen-container {
  width: 100vw;
  height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: 15vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.main-title {
  font-size: clamp(24px, 4vw, 48px);
  font-weight: bold;
  letter-spacing: 2px;
}

.content-wrapper {
  flex: 1;
  display: flex;
  width: 100%;
  padding: 0 4vw;
  align-items: center;
}

.left-section {
  flex: 4.5;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-right: 2vw;
}

.text-content {
  width: 100%;
  font-size: clamp(16px, 1.5vw, 24px);
  line-height: 1.6;
  text-align: justify;
  text-indent: 0;
}

.right-section {
  flex: 5.5;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-left: 2vw;
}

.image-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.image-container img {
  width: 100%;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column;
    padding: 20px;
  }
  .left-section, .right-section {
    flex: auto;
    width: 100%;
    padding: 10px 0;
  }
  .header {
    height: auto;
    padding: 20px 0;
  }
}
</style>