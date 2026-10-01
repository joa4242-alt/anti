import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages는 https://joa4242-alt.github.io/anti/ 아래에서 열리므로 배포할 때만 경로를 바꾼다
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    // PWA: 홈 화면 설치 + 오프라인 동작 (PRD 2장, 13장, 16장)
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '체험학습 버스자리',
        short_name: '버스자리',
        description: '초등학교 체험학습 버스 좌석을 공정하게 랜덤 배정하는 앱',
        lang: 'ko',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'any',
        background_color: '#090d16',
        theme_color: '#1e1b4b',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // 엑셀 라이브러리 조각까지 미리 저장해 두어 오프라인에서도 불러오기 가능
        globPatterns: ['**/*.{js,css,html,svg,png}'],
      },
    }),
  ],
})
