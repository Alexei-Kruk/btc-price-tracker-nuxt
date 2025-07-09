// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/fonts'],
  runtimeConfig: {
    DATABASE_URL: process.env.DATABASE_URL
  },
  
  // Оптимизированная конфигурация для ApexCharts
  build: {
    transpile: [
      'apexcharts',
      'vue3-apexcharts'
    ]
  },
  
  // Настройки для корректной работы с графиками
  vite: {
    optimizeDeps: {
      include: ['apexcharts']
    }
  },
  
  // Плагины (убедитесь, что файл существует)
  plugins: ['~/plugins/apexcharts.client.ts'], // Изменено на .client.ts
  
  // Отключаем SSR для компонентов с графиками
  ssr: false, // Можно также оставить true и использовать ClientOnly
  
  // Настройки компонентов
  components: {
    global: true,
    dirs: ['~/components']
  },
  
  // Дополнительные настройки для production
  nitro: {
    prerender: {
      crawlLinks: false // Отключаем для избежания проблем с графиками
    }
  }
})