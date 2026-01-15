import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  // В Wayback Machine отключаем автоматическую синхронизацию истории
  scrollBehavior(to, from, savedPosition) {
    // В Wayback Machine не пытаемся восстанавливать позицию скролла
    if (typeof window !== 'undefined' && 
        (window.location.href.includes('web.archive.org') || 
         window.location.href.includes('archive.org'))) {
      return false
    }
    return savedPosition || { top: 0 }
  }
}
